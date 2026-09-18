import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../common/storage/storage.service";
import { CacheService } from "../common/cache/cache.service";
import { RecommendationService } from "../recommendation/recommendation.service";
import { extractCvText } from "../common/storage/cv-text-extractor";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { CreateExperienceDto, UpdateExperienceDto } from "./dto/experience.dto";
import { CreateEducationDto, UpdateEducationDto } from "./dto/education.dto";
import { CreateCertificationDto, UpdateCertificationDto } from "./dto/certification.dto";
import { CreateProjectDto, UpdateProjectDto } from "./dto/project.dto";
import { UpsertSkillDto } from "./dto/skill.dto";

export interface SkillGapItem {
  skill: string;
  demand: number;
}

export interface ProfileInsights {
  readiness: number;
  completeness: number;
  skillCoverage: number;
  matchedSkills: string[];
  missingSkills: SkillGapItem[];
  recommendedJobs: Array<{
    id: string;
    title: string;
    company: string | null;
    location: string | null;
    recommendationScore: number;
    matchedSkillCount: number;
  }>;
  tips: string[];
}

export interface ProfileDashboard {
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
  savedJobs: number;
  recentApplications: Array<{
    id: string;
    status: string;
    appliedAt: Date;
    jobTitle: string;
    company: string | null;
  }>;
}

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly cache: CacheService,
    private readonly recommendations: RecommendationService
  ) {}

  listUsers() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }

  getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        workExperiences: { orderBy: { startDate: "desc" } },
        educations: { orderBy: { startYear: "desc" } },
        userSkills: {
          include: { skill: true }
        },
        certifications: { orderBy: { issueDate: "desc" } },
        projects: { orderBy: { createdAt: "desc" } },
        cvFiles: { orderBy: { isPrimary: "desc" }, take: 10 }
      }
    });
  }

  async updateProfile(userId: string, payload: UpdateProfileDto) {
    const existing = await this.prisma.userProfile.findUnique({ where: { userId } });

    const jsonData: { socialLinks?: Prisma.InputJsonValue; languages?: Prisma.InputJsonValue } = {};
    if (payload.socialLinks !== undefined) {
      jsonData.socialLinks = payload.socialLinks as unknown as Prisma.InputJsonValue;
    }
    if (payload.languages !== undefined) {
      jsonData.languages = payload.languages as unknown as Prisma.InputJsonValue;
    }

    if (!existing) {
      await this.prisma.userProfile.create({
        data: {
          userId,
          fullName: payload.fullName ?? "New Member",
          headline: payload.headline,
          about: payload.about,
          location: payload.location,
          avatarUrl: payload.avatarUrl,
          coverUrl: payload.coverUrl,
          ...jsonData
        }
      });
    } else {
      await this.prisma.userProfile.update({
        where: { userId },
        data: {
          fullName: payload.fullName ?? undefined,
          headline: payload.headline ?? undefined,
          about: payload.about ?? undefined,
          location: payload.location ?? undefined,
          avatarUrl: payload.avatarUrl ?? undefined,
          coverUrl: payload.coverUrl ?? undefined,
          ...jsonData
        }
      });
    }

    return this.recomputeCompleteness(userId);
  }

  /**
   * Recompute the weighted profile completeness from the full DB record so that
   * sections (experience, education, skills, projects, certifications, links)
   * are all reflected, not just the basic profile fields.
   */
  async recomputeCompleteness(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        workExperiences: true,
        educations: true,
        userSkills: true,
        certifications: true,
        projects: true,
        cvFiles: true
      }
    });
    if (!user?.profile) {
      return user?.profile ?? null;
    }

    const p = user.profile;
    const languages = Array.isArray(p.languages) ? (p.languages as unknown[]) : [];
    const links = p.socialLinks && typeof p.socialLinks === "object" ? (p.socialLinks as Record<string, unknown>) : {};
    const hasLink = Object.values(links).some((v) => Boolean(v));

    const checks: Array<{ ok: boolean; weight: number }> = [
      { ok: Boolean(p.fullName), weight: 10 },
      { ok: Boolean(p.headline), weight: 10 },
      { ok: Boolean(p.about), weight: 10 },
      { ok: Boolean(p.location), weight: 5 },
      { ok: Boolean(p.avatarUrl), weight: 10 },
      { ok: Boolean(p.coverUrl), weight: 5 },
      { ok: user.workExperiences.length > 0, weight: 15 },
      { ok: user.educations.length > 0, weight: 10 },
      { ok: user.userSkills.length >= 3, weight: 10 },
      { ok: user.projects.length > 0, weight: 5 },
      { ok: user.certifications.length > 0, weight: 5 },
      { ok: languages.length > 0, weight: 2 },
      { ok: hasLink, weight: 3 }
    ];
    const score = checks.reduce((sum, c) => (c.ok ? sum + c.weight : sum), 0);

    return this.prisma.userProfile.update({
      where: { userId },
      data: { profileCompleteness: Math.min(100, score) }
    });
  }

  async getOnboardingChecklist(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        userSkills: true,
        workExperiences: true,
        educations: true,
        certifications: true,
        projects: true,
        cvFiles: true
      }
    });
    if (!user) {
      return {
        completion: 0,
        items: []
      };
    }

    const languages = Array.isArray(user.profile?.languages)
      ? (user.profile?.languages as unknown[])
      : [];
    const links =
      user.profile?.socialLinks && typeof user.profile.socialLinks === "object"
        ? (user.profile.socialLinks as Record<string, unknown>)
        : {};
    const hasLink = Object.values(links).some((v) => Boolean(v));

    const checklist = [
      { key: "full_name", label: "Add full name", section: "basic", done: Boolean(user.profile?.fullName) },
      { key: "headline", label: "Add professional headline", section: "basic", done: Boolean(user.profile?.headline) },
      { key: "about", label: "Add profile summary", section: "basic", done: Boolean(user.profile?.about) },
      { key: "avatar", label: "Upload a profile photo", section: "basic", done: Boolean(user.profile?.avatarUrl) },
      { key: "experience", label: "Add at least one work experience", section: "experience", done: user.workExperiences.length > 0 },
      { key: "education", label: "Add at least one education record", section: "education", done: user.educations.length > 0 },
      { key: "skills", label: "Add at least 3 skills", section: "skills", done: user.userSkills.length >= 3 },
      { key: "projects", label: "Showcase a project", section: "projects", done: user.projects.length > 0 },
      { key: "certifications", label: "Add a certification", section: "certifications", done: user.certifications.length > 0 },
      { key: "languages", label: "Add a language", section: "languages", done: languages.length > 0 },
      { key: "links", label: "Add a portfolio or social link", section: "links", done: hasLink },
      { key: "cv", label: "Upload a CV", section: "cv", done: user.cvFiles.length > 0 }
    ];
    const doneCount = checklist.filter((item) => item.done).length;
    const completion = Math.round((doneCount / checklist.length) * 100);

    return {
      completion,
      items: checklist
    };
  }

  // --- Public profile ---

  /** Generate (and persist) a stable, unique public slug for sharing. */
  async ensurePublicSlug(userId: string): Promise<{ slug: string }> {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (profile?.publicSlug) return { slug: profile.publicSlug };

    const base =
      (profile?.fullName ?? "member")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "member";

    let slug = `${base}-${userId.slice(0, 6)}`;
    let attempt = 0;
    // Extremely unlikely to collide, but guard anyway.
    while (await this.prisma.userProfile.findUnique({ where: { publicSlug: slug } })) {
      attempt += 1;
      slug = `${base}-${userId.slice(0, 6)}-${attempt}`;
    }

    if (!profile) {
      await this.prisma.userProfile.create({
        data: { userId, fullName: "New Member", publicSlug: slug }
      });
    } else {
      await this.prisma.userProfile.update({ where: { userId }, data: { publicSlug: slug } });
    }
    return { slug };
  }

  /**
   * Privacy-filtered public projection. Resolves by publicSlug, falling back to a
   * raw userId so links keep working before a slug is generated. Returns null when
   * the profile is private or missing.
   */
  async getPublicProfile(slug: string) {
    // `userId` is a UUID column, so only match it when the slug is a valid UUID
    // (otherwise Prisma throws on the malformed input).
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const profile = await this.prisma.userProfile.findFirst({
      where: isUuid ? { OR: [{ publicSlug: slug }, { userId: slug }] } : { publicSlug: slug }
    });
    if (!profile) return null;

    const userId = profile.userId;
    const privacy = await this.prisma.privacySettings.findUnique({ where: { userId } });
    const isPublic = !privacy || privacy.profileVisibility === "PUBLIC";
    if (!isPublic) return null;
    const showActivity = !privacy || privacy.showActivity;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        workExperiences: { orderBy: { startDate: "desc" } },
        educations: { orderBy: { startYear: "desc" } },
        userSkills: { include: { skill: true } },
        certifications: { orderBy: { issueDate: "desc" } },
        projects: { orderBy: { createdAt: "desc" } }
      }
    });
    if (!user || user.deletedAt) return null;

    let applicationsCount = 0;
    if (showActivity) {
      applicationsCount = await this.prisma.application.count({ where: { candidateId: userId } });
    }

    return {
      slug: profile.publicSlug ?? userId,
      fullName: user.profile?.fullName ?? "Member",
      headline: user.profile?.headline ?? null,
      about: user.profile?.about ?? null,
      location: user.profile?.location ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      coverUrl: user.profile?.coverUrl ?? null,
      socialLinks: user.profile?.socialLinks ?? null,
      languages: user.profile?.languages ?? null,
      skills: user.userSkills.map((s) => ({ name: s.skill.name, level: s.level })),
      experiences: user.workExperiences.map((e) => ({
        company: e.company,
        position: e.position,
        startDate: e.startDate,
        endDate: e.endDate,
        isCurrent: e.isCurrent,
        description: e.description
      })),
      educations: user.educations.map((e) => ({
        school: e.school,
        degree: e.degree,
        major: e.major,
        startYear: e.startYear,
        endYear: e.endYear
      })),
      projects: user.projects.map((p) => ({
        title: p.title,
        description: p.description,
        url: p.url,
        skills: p.skills
      })),
      certifications: user.certifications.map((c) => ({
        name: c.name,
        issuer: c.issuer,
        issueDate: c.issueDate,
        credentialUrl: c.credentialUrl
      })),
      activity: showActivity ? { applications: applicationsCount } : null
    };
  }

  // --- Insights & dashboard ---

  /**
   * AI-flavoured readiness + skill-gap analysis. We mix the profile completeness
   * with how well the candidate's skills cover the skills demanded by the jobs we
   * would recommend to them, then surface the most in-demand missing skills.
   */
  async getInsights(userId: string): Promise<ProfileInsights> {
    const cacheKey = `user-insights:${userId}`;
    const cached = await this.cache.get<ProfileInsights>(cacheKey);
    if (cached) return cached;

    const [profile, userSkills, recommended] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.prisma.userSkill.findMany({ where: { userId }, include: { skill: true } }),
      this.recommendations.recommendJobs(userId, 12)
    ]);

    const completeness = profile?.profileCompleteness ?? 0;
    const ownedSkills = new Set(userSkills.map((s) => s.skill.name.toLowerCase()));

    // Aggregate demand for skills across the jobs we'd recommend.
    const demand = new Map<string, number>();
    for (const job of recommended) {
      const required = Array.isArray(job.requiredSkills)
        ? (job.requiredSkills as unknown[]).map((s) => String(s))
        : [];
      for (const raw of required) {
        const key = raw.trim();
        if (!key) continue;
        demand.set(key.toLowerCase(), (demand.get(key.toLowerCase()) ?? 0) + 1);
      }
    }

    const totalDemand = Array.from(demand.values()).reduce((a, b) => a + b, 0);
    let coveredDemand = 0;
    const matchedSkills: string[] = [];
    const missing: SkillGapItem[] = [];
    for (const [skill, count] of demand.entries()) {
      if (ownedSkills.has(skill)) {
        coveredDemand += count;
        matchedSkills.push(skill);
      } else {
        missing.push({ skill, demand: count });
      }
    }
    missing.sort((a, b) => b.demand - a.demand);

    const skillCoverage = totalDemand > 0 ? Math.round((coveredDemand / totalDemand) * 100) : 0;
    const readiness = Math.round(completeness * 0.6 + skillCoverage * 0.4);

    const tips: string[] = [];
    if (completeness < 80) tips.push("Complete your profile sections to boost recruiter visibility.");
    if (ownedSkills.size < 5) tips.push("Add more skills — aim for at least 5 to match more jobs.");
    if (missing.length > 0) {
      tips.push(`In-demand skills you're missing: ${missing.slice(0, 3).map((m) => m.skill).join(", ")}.`);
    }
    if (userSkills.length > 0 && recommended.length === 0) {
      tips.push("No active jobs match yet — broaden your skills or check back soon.");
    }

    const result: ProfileInsights = {
      readiness,
      completeness,
      skillCoverage,
      matchedSkills: matchedSkills.slice(0, 12),
      missingSkills: missing.slice(0, 8),
      recommendedJobs: recommended.slice(0, 5).map((job) => {
        const required = Array.isArray(job.requiredSkills)
          ? (job.requiredSkills as unknown[]).map((s) => String(s).toLowerCase())
          : [];
        return {
          id: job.id,
          title: job.title,
          company: job.company?.name ?? null,
          location: job.location ?? null,
          recommendationScore: job.recommendationScore,
          matchedSkillCount: required.filter((s) => ownedSkills.has(s)).length
        };
      }),
      tips
    };

    await this.cache.set(cacheKey, result, 5 * 60);
    return result;
  }

  async getDashboard(userId: string): Promise<ProfileDashboard> {
    const [grouped, savedJobs, savedExternalJobs, recent] = await Promise.all([
      this.prisma.application.groupBy({
        by: ["status"],
        where: { candidateId: userId },
        _count: { _all: true }
      }),
      this.prisma.savedJob.count({ where: { userId } }),
      this.prisma.savedExternalJob.count({ where: { userId } }),
      this.prisma.application.findMany({
        where: { candidateId: userId },
        orderBy: { appliedAt: "desc" },
        take: 5,
        include: { job: { include: { company: true } } }
      })
    ]);

    const applicationsByStatus: Record<string, number> = {};
    let totalApplications = 0;
    for (const row of grouped) {
      applicationsByStatus[row.status] = row._count._all;
      totalApplications += row._count._all;
    }

    return {
      totalApplications,
      applicationsByStatus,
      savedJobs: savedJobs + savedExternalJobs,
      recentApplications: recent.map((app) => ({
        id: app.id,
        status: app.status,
        appliedAt: app.appliedAt,
        jobTitle: app.job.title,
        company: app.job.company?.name ?? null
      }))
    };
  }

  async uploadCv(userId: string, file: Express.Multer.File) {
    const uploaded = await this.storage.upload({
      buffer: file.buffer,
      folder: `cvs/${userId}`,
      originalName: file.originalname,
      contentType: file.mimetype
    });

    const extractedText = await extractCvText(file.buffer, file.originalname);

    // Unset primary for existing CVs
    await this.prisma.cvFile.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false }
    });

    return this.prisma.cvFile.create({
      data: {
        userId,
        fileName: file.originalname,
        fileUrl: uploaded.url,
        fileSize: uploaded.size,
        isPrimary: true,
        extractedText: extractedText || null
      }
    });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const uploaded = await this.storage.upload({
      buffer: file.buffer,
      folder: `avatars/${userId}`,
      originalName: file.originalname,
      contentType: file.mimetype
    });

    const existing = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!existing) {
      await this.prisma.userProfile.create({
        data: { userId, fullName: "New Member", avatarUrl: uploaded.url }
      });
    } else {
      await this.prisma.userProfile.update({
        where: { userId },
        data: { avatarUrl: uploaded.url }
      });
    }

    return { avatarUrl: uploaded.url };
  }

  async uploadCover(userId: string, file: Express.Multer.File) {
    const uploaded = await this.storage.upload({
      buffer: file.buffer,
      folder: `covers/${userId}`,
      originalName: file.originalname,
      contentType: file.mimetype
    });

    const existing = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!existing) {
      await this.prisma.userProfile.create({
        data: { userId, fullName: "New Member", coverUrl: uploaded.url }
      });
    } else {
      await this.prisma.userProfile.update({
        where: { userId },
        data: { coverUrl: uploaded.url }
      });
    }

    await this.recomputeCompleteness(userId);
    return { coverUrl: uploaded.url };
  }

  // --- CV management ---
  async setPrimaryCv(userId: string, cvId: string) {
    const cv = await this.prisma.cvFile.findUnique({ where: { id: cvId } });
    if (!cv || cv.userId !== userId) {
      throw new NotFoundException("CV not found");
    }
    await this.prisma.$transaction([
      this.prisma.cvFile.updateMany({ where: { userId, isPrimary: true }, data: { isPrimary: false } }),
      this.prisma.cvFile.update({ where: { id: cvId }, data: { isPrimary: true } })
    ]);
    return { id: cvId, isPrimary: true };
  }

  async deleteCv(userId: string, cvId: string) {
    const cv = await this.prisma.cvFile.findUnique({ where: { id: cvId } });
    if (!cv || cv.userId !== userId) {
      throw new NotFoundException("CV not found");
    }
    try {
      await this.prisma.cvFile.delete({ where: { id: cvId } });
    } catch {
      throw new ForbiddenException("Cannot delete a CV that is attached to an application");
    }
    // If we removed the primary CV, promote the most recent remaining one.
    if (cv.isPrimary) {
      const next = await this.prisma.cvFile.findFirst({ where: { userId }, orderBy: { id: "desc" } });
      if (next) {
        await this.prisma.cvFile.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
    }
    return { deleted: true };
  }

  // --- Work experience CRUD ---
  listExperiences(userId: string) {
    return this.prisma.workExperience.findMany({
      where: { userId },
      orderBy: { startDate: "desc" }
    });
  }

  createExperience(userId: string, dto: CreateExperienceDto) {
    return this.prisma.workExperience.create({
      data: {
        userId,
        company: dto.company,
        position: dto.position,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isCurrent: dto.isCurrent ?? false,
        description: dto.description
      }
    });
  }

  async updateExperience(userId: string, id: string, dto: UpdateExperienceDto) {
    await this.ensureOwnership("workExperience", id, userId);
    return this.prisma.workExperience.update({
      where: { id },
      data: {
        company: dto.company,
        position: dto.position,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate === undefined ? undefined : dto.endDate ? new Date(dto.endDate) : null,
        isCurrent: dto.isCurrent,
        description: dto.description
      }
    });
  }

  async deleteExperience(userId: string, id: string) {
    await this.ensureOwnership("workExperience", id, userId);
    await this.prisma.workExperience.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Education CRUD ---
  listEducations(userId: string) {
    return this.prisma.education.findMany({
      where: { userId },
      orderBy: { startYear: "desc" }
    });
  }

  createEducation(userId: string, dto: CreateEducationDto) {
    return this.prisma.education.create({
      data: {
        userId,
        school: dto.school,
        degree: dto.degree,
        major: dto.major,
        gpa: dto.gpa,
        startYear: dto.startYear,
        endYear: dto.endYear
      }
    });
  }

  async updateEducation(userId: string, id: string, dto: UpdateEducationDto) {
    await this.ensureOwnership("education", id, userId);
    return this.prisma.education.update({
      where: { id },
      data: {
        school: dto.school,
        degree: dto.degree,
        major: dto.major,
        gpa: dto.gpa,
        startYear: dto.startYear,
        endYear: dto.endYear
      }
    });
  }

  async deleteEducation(userId: string, id: string) {
    await this.ensureOwnership("education", id, userId);
    await this.prisma.education.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Skill CRUD ---
  listSkills(userId: string) {
    return this.prisma.userSkill.findMany({
      where: { userId },
      include: { skill: true }
    });
  }

  async upsertSkill(userId: string, dto: UpsertSkillDto) {
    const name = dto.name.trim();
    const skill = await this.prisma.skill.upsert({
      where: { name },
      create: { name },
      update: {}
    });
    return this.prisma.userSkill.upsert({
      where: { userId_skillId: { userId, skillId: skill.id } },
      create: {
        userId,
        skillId: skill.id,
        level: dto.level,
        yearsExp: dto.yearsExp ?? null
      },
      update: {
        level: dto.level,
        yearsExp: dto.yearsExp ?? null
      },
      include: { skill: true }
    });
  }

  async deleteSkill(userId: string, skillId: string) {
    await this.prisma.userSkill.deleteMany({ where: { userId, skillId } });
    return { deleted: true };
  }

  // --- Certification CRUD ---
  listCertifications(userId: string) {
    return this.prisma.certification.findMany({
      where: { userId },
      orderBy: { issueDate: "desc" }
    });
  }

  createCertification(userId: string, dto: CreateCertificationDto) {
    return this.prisma.certification.create({
      data: {
        userId,
        name: dto.name,
        issuer: dto.issuer,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
        credentialUrl: dto.credentialUrl
      }
    });
  }

  async updateCertification(userId: string, id: string, dto: UpdateCertificationDto) {
    await this.ensureOwnership("certification", id, userId);
    return this.prisma.certification.update({
      where: { id },
      data: {
        name: dto.name,
        issuer: dto.issuer,
        issueDate: dto.issueDate === undefined ? undefined : dto.issueDate ? new Date(dto.issueDate) : null,
        credentialUrl: dto.credentialUrl
      }
    });
  }

  async deleteCertification(userId: string, id: string) {
    await this.ensureOwnership("certification", id, userId);
    await this.prisma.certification.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Project CRUD ---
  listProjects(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  createProject(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        url: dto.url,
        skills: (dto.skills ?? []) as Prisma.InputJsonValue,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null
      }
    });
  }

  async updateProject(userId: string, id: string, dto: UpdateProjectDto) {
    await this.ensureOwnership("project", id, userId);
    return this.prisma.project.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        url: dto.url,
        skills: dto.skills === undefined ? undefined : (dto.skills as Prisma.InputJsonValue),
        startDate: dto.startDate === undefined ? undefined : dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate === undefined ? undefined : dto.endDate ? new Date(dto.endDate) : null
      }
    });
  }

  async deleteProject(userId: string, id: string) {
    await this.ensureOwnership("project", id, userId);
    await this.prisma.project.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensureOwnership(
    model: "workExperience" | "education" | "certification" | "project",
    id: string,
    userId: string
  ) {
    const finders = {
      workExperience: () => this.prisma.workExperience.findUnique({ where: { id } }),
      education: () => this.prisma.education.findUnique({ where: { id } }),
      certification: () => this.prisma.certification.findUnique({ where: { id } }),
      project: () => this.prisma.project.findUnique({ where: { id } })
    } as const;
    const record = await finders[model]();
    if (!record) {
      throw new NotFoundException("Record not found");
    }
    if (record.userId !== userId) {
      throw new ForbiddenException("Cannot modify another user's record");
    }
  }
}
