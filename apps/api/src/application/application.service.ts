import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Application, ApplicationStatus, OfferStatus, Prisma, UserRole } from "@prisma/client";
import { AiScreeningService } from "../ai-screening/ai-screening.service";
import { RequestUser } from "../common/auth/request-user.type";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationGateway } from "../realtime/notification.gateway";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { RespondOfferDto } from "./dto/respond-offer.dto";
import { SendOfferDto } from "./dto/send-offer.dto";

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

  async rescreenApplication(
    applicationId: string,
    changedBy: string,
    role: UserRole
  ): Promise<{ message: string }> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: { id: true, candidateId: true, jobId: true },
    });
    if (!application) {
      throw new NotFoundException("Application not found");
    }
    await this.ensureRecruiterCanMutateApplication(applicationId, changedBy, role);

    setImmediate(() => {
      void this.runAiScreening(application.id, application.candidateId, application.jobId);
    });

    return { message: "Re-screening queued" };
  }

  // ─── AI screening pipeline ───────────────────────────────────────────────────

  private async runAiScreening(applicationId: string, candidateId: string, jobId: string): Promise<void> {
    try {
      // 1. Mark AI_SCREENING
      await this.transitionApplicationStatus({
        applicationId,
        toStatus: ApplicationStatus.AI_SCREENING,
        changedBy: candidateId,
        note: "Queued for AI screening",
        notifyCandidate: false
      });

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
      // fallback engine have meaningful content to parse. The actual uploaded
      // CV text (when available) is prioritised so scoring reflects the file.
      const cvContent = [
        data.cvFile.extractedText ?? "",
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

      // 5. Notify candidate that the screening result is ready.
      await this.createCandidateNotification({
        candidateId,
        type: "AI_SCREENING_DONE",
        title: "Đã có kết quả AI Screening",
        body: `Điểm phù hợp: ${aiResult.overall_score}/100 (${aiResult.grade}) — ${aiResult.recommendation}`,
        data: {
          applicationId,
          overallScore: aiResult.overall_score,
          grade: aiResult.grade,
          recommendation: aiResult.recommendation,
          processingTimeMs: aiResult.processing_time_ms
        }
      });

      // 6. Return to APPLIED — HR_REVIEW only when recruiter moves status manually.
      await this.transitionApplicationStatus({
        applicationId,
        toStatus: ApplicationStatus.APPLIED,
        changedBy: candidateId,
        note: `AI score: ${aiResult.overall_score} (${aiResult.grade})`,
        notifyCandidate: false
      });

      this.logger.log(`AI screening done for ${applicationId}: score=${aiResult.overall_score} grade=${aiResult.grade}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`AI screening pipeline failed for ${applicationId}: ${message}`);
    }
  }

  private async transitionApplicationStatus(options: {
    applicationId: string;
    toStatus: ApplicationStatus;
    changedBy: string;
    note?: string | null;
    notifyCandidate?: boolean;
  }): Promise<Application> {
    const application = await this.prisma.application.findUnique({
      where: { id: options.applicationId },
      include: {
        job: { include: { company: true } },
        candidate: { include: { profile: true } }
      }
    });
    if (!application) {
      throw new NotFoundException("Application not found");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id: options.applicationId },
        data: { status: options.toStatus }
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: options.applicationId,
          fromStatus: application.status,
          toStatus: options.toStatus,
          changedBy: options.changedBy,
          note: options.note ?? undefined
        }
      });

      return updated;
    });

    if (options.notifyCandidate !== false) {
      const message = this.buildStatusNotification(application, options.toStatus, options.note);
      await this.createCandidateNotification({
        candidateId: application.candidateId,
        type: "application_status_changed",
        title: message.title,
        body: message.body,
        data: {
          applicationId: application.id,
          jobId: application.jobId,
          jobTitle: application.job.title,
          companyName: application.job.company.name,
          fromStatus: application.status,
          toStatus: options.toStatus,
          note: options.note ?? null,
          changedAt: new Date().toISOString()
        }
      });
    }

    return result;
  }

  private async createCandidateNotification(options: {
    candidateId: string;
    type: string;
    title: string;
    body: string;
    data: Prisma.InputJsonValue;
  }): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: options.candidateId,
        type: options.type,
        title: options.title,
        body: options.body,
        data: options.data
      }
    });

    await this.notificationGateway.notify({
      userId: options.candidateId,
      type: options.type,
      payload: options.data as Record<string, unknown>
    });
  }

  private buildStatusNotification(
    application: Application & { job: { title: string; company: { name: string } } },
    toStatus: ApplicationStatus,
    note?: string | null
  ): { title: string; body: string } {
    const jobName = application.job.title;
    const companyName = application.job.company.name;
    const suffix = note ? ` Ghi chú từ HR: ${note}` : "";

    const labels: Record<ApplicationStatus, { title: string; body: string }> = {
      APPLIED: {
        title: "Đã nhận hồ sơ ứng tuyển",
        body: `Hồ sơ của bạn cho vị trí ${jobName} tại ${companyName} đã được ghi nhận.${suffix}`
      },
      AI_SCREENING: {
        title: "Hồ sơ đang được AI sàng lọc",
        body: `Hồ sơ của bạn cho vị trí ${jobName} đang được hệ thống AI phân tích.${suffix}`
      },
      HR_REVIEW: {
        title: "Hồ sơ đang được HR xem xét",
        body: `HR của ${companyName} đang xem xét hồ sơ của bạn cho vị trí ${jobName}.${suffix}`
      },
      INTERVIEW: {
        title: "Bạn được mời phỏng vấn",
        body: `${companyName} đã chuyển hồ sơ của bạn sang vòng phỏng vấn cho vị trí ${jobName}.${suffix}`
      },
      OFFER: {
        title: "Bạn nhận được offer",
        body: `${companyName} đã chuyển hồ sơ của bạn sang bước offer cho vị trí ${jobName}.${suffix}`
      },
      HIRED: {
        title: "Chúc mừng bạn đã được tuyển",
        body: `${companyName} đã xác nhận tuyển bạn cho vị trí ${jobName}.${suffix}`
      },
      REJECTED: {
        title: "Cập nhật kết quả ứng tuyển",
        body: `${companyName} đã cập nhật kết quả cho vị trí ${jobName}: hồ sơ chưa phù hợp ở thời điểm hiện tại.${suffix}`
      }
    };

    return labels[toStatus];
  }

  private async ensureRecruiterCanMutateApplication(
    applicationId: string,
    userId: string,
    role: UserRole
  ): Promise<void> {
    if (role === UserRole.ADMIN) return;

    const membership = await this.prisma.companyMember.findFirst({
      where: {
        userId,
        company: {
          jobs: {
            some: {
              applications: { some: { id: applicationId } }
            }
          }
        }
      }
    });

    if (!membership) {
      throw new ForbiddenException("Recruiter can only update applications of own company jobs");
    }
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
        offer: true,
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
        offer: true,
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
    role: UserRole,
    note?: string
  ) {
    await this.ensureRecruiterCanMutateApplication(applicationId, changedBy, role);
    return this.transitionApplicationStatus({
      applicationId,
      toStatus,
      changedBy,
      note
    });
  }

  async scheduleInterview(
    applicationId: string,
    interviewAt: string,
    changedBy: string,
    role: UserRole,
    note?: string
  ) {
    await this.ensureRecruiterCanMutateApplication(applicationId, changedBy, role);
    const interviewTime = new Date(interviewAt).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    return this.transitionApplicationStatus({
      applicationId,
      toStatus: ApplicationStatus.INTERVIEW,
      changedBy,
      note: `Lịch phỏng vấn: ${interviewTime}${note ? ` - ${note}` : ""}`
    });
  }

  // ─── Recruiter: send / update offer ────────────────────────────────────────────

  async sendOffer(applicationId: string, dto: SendOfferDto, changedBy: string, role: UserRole) {
    await this.ensureRecruiterCanMutateApplication(applicationId, changedBy, role);

    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: { id: true }
    });
    if (!application) {
      throw new NotFoundException("Application not found");
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : null;
    const responseDeadline = dto.responseDeadline ? new Date(dto.responseDeadline) : null;
    const salaryCurrency = dto.salaryCurrency?.trim() || "VND";

    const offerData = {
      salaryAmount: dto.salaryAmount ?? null,
      salaryCurrency,
      startDate,
      responseDeadline,
      note: dto.note ?? null,
      offerLetterUrl: dto.offerLetterUrl ?? null,
      status: OfferStatus.PENDING,
      declineReason: null,
      respondedAt: null,
      createdBy: changedBy
    };

    const offer = await this.prisma.offer.upsert({
      where: { applicationId },
      create: { applicationId, ...offerData },
      update: offerData
    });

    await this.transitionApplicationStatus({
      applicationId,
      toStatus: ApplicationStatus.OFFER,
      changedBy,
      note: this.buildOfferSummary(offer)
    });

    return offer;
  }

  // ─── Candidate: accept / decline offer ──────────────────────────────────────────

  async respondToOffer(applicationId: string, candidateId: string, dto: RespondOfferDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        offer: true,
        job: { include: { company: true } },
        candidate: { include: { profile: true } }
      }
    });
    if (!application || !application.offer) {
      throw new NotFoundException("Offer not found");
    }
    if (application.candidateId !== candidateId) {
      throw new ForbiddenException("You can only respond to your own offer");
    }
    if (application.offer.status !== OfferStatus.PENDING) {
      throw new ForbiddenException("This offer has already been responded to");
    }

    const accepted = dto.action === "accept";

    const offer = await this.prisma.offer.update({
      where: { applicationId },
      data: {
        status: accepted ? OfferStatus.ACCEPTED : OfferStatus.DECLINED,
        declineReason: accepted ? null : dto.reason ?? null,
        respondedAt: new Date()
      }
    });

    await this.transitionApplicationStatus({
      applicationId,
      toStatus: accepted ? ApplicationStatus.HIRED : ApplicationStatus.REJECTED,
      changedBy: candidateId,
      note: accepted
        ? "Ứng viên đã chấp nhận offer"
        : `Ứng viên đã từ chối offer${dto.reason ? `: ${dto.reason}` : ""}`
    });

    // Notify the recruiter who sent the offer about the candidate's decision.
    const candidateName =
      application.candidate?.profile?.fullName ?? application.candidate?.email ?? "Ứng viên";
    await this.createCandidateNotification({
      candidateId: offer.createdBy,
      type: "offer_response",
      title: accepted ? "Ứng viên đã chấp nhận offer" : "Ứng viên đã từ chối offer",
      body: `${candidateName} ${accepted ? "đã chấp nhận" : "đã từ chối"} offer cho vị trí ${application.job.title}.${
        !accepted && dto.reason ? ` Lý do: ${dto.reason}` : ""
      }`,
      data: {
        applicationId,
        jobId: application.jobId,
        jobTitle: application.job.title,
        candidateName,
        action: dto.action,
        reason: dto.reason ?? null,
        respondedAt: offer.respondedAt?.toISOString() ?? new Date().toISOString()
      }
    });

    return offer;
  }

  private buildOfferSummary(offer: {
    salaryAmount: number | null;
    salaryCurrency: string;
    startDate: Date | null;
    responseDeadline: Date | null;
  }): string {
    const parts: string[] = [];
    if (offer.salaryAmount != null) {
      parts.push(`Lương: ${offer.salaryAmount.toLocaleString("vi-VN")} ${offer.salaryCurrency}`);
    }
    if (offer.startDate) {
      parts.push(`Ngày bắt đầu: ${offer.startDate.toLocaleDateString("vi-VN")}`);
    }
    if (offer.responseDeadline) {
      parts.push(`Phản hồi trước: ${offer.responseDeadline.toLocaleDateString("vi-VN")}`);
    }
    return parts.length ? parts.join(" • ") : "HR đã gửi đề nghị nhận việc.";
  }
}
