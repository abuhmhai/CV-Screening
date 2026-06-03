import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Application, ApplicationStatus, UserRole } from "@prisma/client";
import { AiScreeningService } from "../ai-screening/ai-screening.service";
import { RequestUser } from "../common/auth/request-user.type";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationGateway } from "../realtime/notification.gateway";
import { CreateApplicationDto } from "./dto/create-application.dto";

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
    private readonly aiScreeningService: AiScreeningService
  ) {}

  // ─── Candidate: submit application ───────────────────────────────────────────

  async create(candidateId: string, payload: CreateApplicationDto): Promise<Application> {
    const existing = await this.prisma.application.findUnique({
      where: {
        jobId_candidateId: {
          jobId: payload.jobId,
          candidateId
        }
      }
    });

    if (existing) {
      setImmediate(() => {
        void this.runAiScreening(existing.id, candidateId, payload.jobId);
      });
      return existing;
    }

    const application = await this.prisma.application.create({
      data: {
        candidateId,
        jobId: payload.jobId,
        cvFileId: payload.cvFileId,
        coverLetter: payload.coverLetter,
        status: ApplicationStatus.APPLIED,
      },
    });

    // Non-blocking: fire AI pipeline after HTTP response is returned
    setImmediate(() => {
      void this.runAiScreening(application.id, candidateId, payload.jobId);
    });

    return application;
  }

  // ─── Candidate: withdraw application ─────────────────────────────────────────

  async withdraw(applicationId: string, candidateId: string): Promise<{ withdrawn: boolean }> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId }
    });
    if (!application) {
      throw new NotFoundException("Application not found");
    }
    if (application.candidateId !== candidateId) {
      throw new ForbiddenException("You can only withdraw your own application");
    }
    if (
      application.status === ApplicationStatus.HIRED ||
      application.status === ApplicationStatus.REJECTED
    ) {
      throw new ForbiddenException("Cannot withdraw a finalized application");
    }

    await this.prisma.application.delete({ where: { id: applicationId } });
    return { withdrawn: true };
  }

  // ─── Recruiter: trigger re-screen ────────────────────────────────────────────

  async rescreenApplication(applicationId: string): Promise<{ message: string }> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: { id: true, candidateId: true, jobId: true },
    });
    if (!application) {
      throw new NotFoundException("Application not found");
    }

    setImmediate(() => {
      void this.runAiScreening(application.id, application.candidateId, application.jobId);
    });

    return { message: "Re-screening queued" };
  }

  // ─── AI screening pipeline ───────────────────────────────────────────────────

  private async runAiScreening(applicationId: string, candidateId: string, jobId: string): Promise<void> {
    try {
      // 1. Mark AI_SCREENING
      await this.setStatusInternal(applicationId, ApplicationStatus.AI_SCREENING, candidateId, "Queued for AI screening");

      // 2. Load CV text + JD text + structured candidate signals
      const data = await this.prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          cvFile: true,
          job: true,
          candidate: {
            include: {
              profile: true,
              userSkills: { include: { skill: true } },
              workExperiences: true,
              educations: true,
            },
          },
        },
      });
      if (!data) return;

      const candidate = data.candidate;
      const candidateSkills = (candidate?.userSkills ?? []).map((item) => ({
        name: item.skill.name,
        years: item.yearsExp != null ? Number(item.yearsExp) : null,
      }));
      const education = (candidate?.educations ?? []).map((row) => ({
        degree: row.degree,
        gpa: row.gpa != null ? Number(row.gpa) : null,
      }));

      const requiredSkills = Array.isArray(data.job.requiredSkills)
        ? (data.job.requiredSkills as unknown[]).map((item) => String(item))
        : [];
      const candidateTotalYears = (candidate?.workExperiences ?? []).reduce((max, exp) => {
        const end = exp.endDate ? new Date(exp.endDate) : new Date();
        const years = (end.getTime() - new Date(exp.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
        return Math.max(max, years);
      }, 0);

      // Build a rich CV text blob so both the Python service and the local
      // fallback engine have meaningful content to parse.
      const cvContent = [
        candidate?.profile?.fullName ?? "",
        candidate?.profile?.headline ?? "",
        candidate?.profile?.about ?? "",
        candidateSkills.length
          ? `Skills: ${candidateSkills.map((s) => `${s.name}${s.years ? ` (${s.years}y)` : ""}`).join(", ")}`
          : "",
        (candidate?.workExperiences ?? [])
          .map((exp) => `${exp.position} at ${exp.company}. ${exp.description ?? ""}`)
          .join("\n"),
        (candidate?.educations ?? [])
          .map((row) => `${row.degree} ${row.major ?? ""} - ${row.school}`)
          .join("\n"),
        data.cvFile.fileName,
      ]
        .filter(Boolean)
        .join("\n");

      const jdText = [
        data.job.title,
        data.job.description,
        requiredSkills.length ? `Required skills: ${requiredSkills.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      // 3. Call AI service (remote Python service, with native TS fallback)
      const aiResult = await this.aiScreeningService.screen(cvContent, jdText, jobId, {
        candidateSkills,
        requiredSkills,
        education,
        candidateTotalYears: Math.round(candidateTotalYears),
      });
      if (!aiResult) {
        this.logger.warn(`AI screening returned null for application ${applicationId}`);
        return;
      }

      // 4. Upsert AiScreeningResult
      await this.prisma.aiScreeningResult.upsert({
        where: { applicationId },
        create: {
          applicationId,
          overallScore: aiResult.overall_score,
          skillScore: aiResult.breakdown.skill_score,
          experienceScore: aiResult.breakdown.experience_score,
          educationScore: aiResult.breakdown.education_score,
          otherScore: aiResult.breakdown.other_score,
          grade: aiResult.grade,
          matchedSkills: aiResult.matched_skills,
          missingSkills: aiResult.missing_skills,
          strengths: aiResult.strengths,
          concerns: aiResult.concerns,
          explanation: aiResult.explanation,
          modelVersion: aiResult.model_version,
          processingTimeMs: aiResult.processing_time_ms,
        },
        update: {
          overallScore: aiResult.overall_score,
          skillScore: aiResult.breakdown.skill_score,
          experienceScore: aiResult.breakdown.experience_score,
          educationScore: aiResult.breakdown.education_score,
          otherScore: aiResult.breakdown.other_score,
          grade: aiResult.grade,
          matchedSkills: aiResult.matched_skills,
          missingSkills: aiResult.missing_skills,
          strengths: aiResult.strengths,
          concerns: aiResult.concerns,
          explanation: aiResult.explanation,
          modelVersion: aiResult.model_version,
          processingTimeMs: aiResult.processing_time_ms,
        },
      });

      // 5. Persist in-app notification
      await this.prisma.notification.create({
        data: {
          userId: candidateId,
          type: "AI_SCREENING_DONE",
          title: "Kết quả AI Screening",
          body: `Điểm phù hợp: ${aiResult.overall_score}/100 (${aiResult.grade}) — ${aiResult.recommendation}`,
          data: {
            applicationId,
            overallScore: aiResult.overall_score,
            grade: aiResult.grade,
          },
        },
      });

      // 6. Advance to HR_REVIEW
      await this.setStatusInternal(
        applicationId,
        ApplicationStatus.HR_REVIEW,
        candidateId,
        `AI score: ${aiResult.overall_score} (${aiResult.grade})`
      );

      // 7. Emit WebSocket event to candidate
      await this.notificationGateway.notify({
        userId: candidateId,
        type: "AI_SCREENING_DONE",
        payload: {
          applicationId,
          overallScore: aiResult.overall_score,
          grade: aiResult.grade,
          recommendation: aiResult.recommendation,
          processingTimeMs: aiResult.processing_time_ms,
        },
      });

      this.logger.log(`AI screening done for ${applicationId}: score=${aiResult.overall_score} grade=${aiResult.grade}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`AI screening pipeline failed for ${applicationId}: ${message}`);
    }
  }

  // Internal helper: set status + write history without triggering WS for automated steps
  private async setStatusInternal(
    applicationId: string,
    toStatus: ApplicationStatus,
    changedBy: string,
    note: string
  ): Promise<void> {
    const current = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: { status: true },
    });
    if (!current) return;

    await this.prisma.$transaction([
      this.prisma.application.update({
        where: { id: applicationId },
        data: { status: toStatus },
      }),
      this.prisma.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: current.status,
          toStatus,
          changedBy,
          note,
        },
      }),
    ]);
  }

  // ─── Reads ────────────────────────────────────────────────────────────────────

  async getOne(applicationId: string, currentUser: RequestUser) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: { include: { company: true } },
        candidate: {
          include: {
            profile: true,
            userSkills: { include: { skill: true } },
            workExperiences: { orderBy: { startDate: "desc" } },
            educations: { orderBy: { startYear: "desc" } },
          },
        },
        cvFile: true,
        aiResult: true,
        statusHistory: { orderBy: { changedAt: "desc" } },
      },
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    if (currentUser.role === UserRole.CANDIDATE && application.candidateId !== currentUser.id) {
      throw new ForbiddenException("Candidate can only view their own applications");
    }

    if (currentUser.role === UserRole.RECRUITER) {
      const membership = await this.prisma.companyMember.findFirst({
        where: {
          userId: currentUser.id,
          companyId: application.job.companyId,
        },
      });

      if (!membership) {
        throw new ForbiddenException("Recruiter can only view applications of own company jobs");
      }
    }

    return application;
  }

  listForCandidate(candidateId: string) {
    return this.prisma.application.findMany({
      where: { candidateId },
      include: {
        job: { include: { company: true } },
        aiResult: true,
      },
      orderBy: { appliedAt: "desc" },
    });
  }

  async listByJobForRecruiter(jobId: string, userId: string, role: UserRole) {
    if (role !== UserRole.ADMIN) {
      const membership = await this.prisma.companyMember.findFirst({
        where: {
          userId,
          company: { jobs: { some: { id: jobId } } },
        },
      });
      if (!membership) {
        throw new ForbiddenException("Recruiter can only view applications of own company jobs");
      }
    }

    return this.prisma.application.findMany({
      where: { jobId },
      include: {
        candidate: { include: { profile: true } },
        cvFile: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            isPrimary: true
          }
        },
        aiResult: true,
        statusHistory: { orderBy: { changedAt: "desc" }, take: 5 },
      },
      orderBy: [{ status: "asc" }, { appliedAt: "desc" }],
    });
  }

  async exportJobApplicationsCsv(jobId: string, userId: string, role: UserRole): Promise<string> {
    const applications = await this.listByJobForRecruiter(jobId, userId, role);
    const jsonArrayToText = (value: unknown): string =>
      Array.isArray(value) ? value.map((item) => String(item)).join(" | ") : "";
    const rows = [
      [
        "Candidate Name",
        "Candidate Email",
        "Status",
        "AI Score",
        "Matched Skills",
        "Missing Skills",
        "Applied At"
      ],
      ...applications.map((app) => [
        app.candidate?.profile?.fullName ?? app.candidate?.email ?? "",
        app.candidate?.email ?? "",
        app.status,
        app.aiResult?.overallScore?.toString() ?? "0",
        jsonArrayToText(app.aiResult?.matchedSkills),
        jsonArrayToText(app.aiResult?.missingSkills),
        app.appliedAt.toISOString()
      ])
    ];

    return rows
      .map((row) =>
        row
          .map((cell) => {
            const escaped = String(cell).replace(/"/g, "\"\"");
            return `"${escaped}"`;
          })
          .join(",")
      )
      .join("\n");
  }

  // ─── Recruiter: update status ─────────────────────────────────────────────────

  async updateStatus(
    applicationId: string,
    toStatus: ApplicationStatus,
    changedBy: string,
    note?: string
  ) {
    const current = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: { status: true, candidateId: true },
    });
    if (!current) {
      throw new ForbiddenException("Application not found");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const application = await tx.application.update({
        where: { id: applicationId },
        data: { status: toStatus },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: current.status,
          toStatus,
          changedBy,
          note,
        },
      });

      return application;
    });

    // Notify candidate on all recruiter-initiated transitions
    await this.notificationGateway.notify({
      userId: current.candidateId,
      type: "application_status_changed",
      payload: {
        applicationId,
        fromStatus: current.status,
        toStatus,
        changedAt: new Date().toISOString(),
      },
    });

    return result;
  }

  async scheduleInterview(
    applicationId: string,
    interviewAt: string,
    changedBy: string,
    note?: string
  ) {
    return this.updateStatus(
      applicationId,
      ApplicationStatus.INTERVIEW,
      changedBy,
      `Interview scheduled at ${interviewAt}${note ? ` - ${note}` : ""}`
    );
  }
}
