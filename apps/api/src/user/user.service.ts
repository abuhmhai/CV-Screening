import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../common/storage/storage.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { CreateExperienceDto, UpdateExperienceDto } from "./dto/experience.dto";
import { CreateEducationDto, UpdateEducationDto } from "./dto/education.dto";
import { UpsertSkillDto } from "./dto/skill.dto";

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService
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
        workExperiences: true,
        educations: true,
        userSkills: {
          include: { skill: true }
        },
        cvFiles: { orderBy: { isPrimary: "desc" }, take: 10 }
      }
    });
  }

  async updateProfile(userId: string, payload: UpdateProfileDto) {
    const existing = await this.prisma.userProfile.findUnique({ where: { userId } });
    const completenessScore = this.computeCompleteness(payload);

    if (!existing) {
      return this.prisma.userProfile.create({
        data: {
          userId,
          fullName: payload.fullName ?? "New Member",
          headline: payload.headline,
          about: payload.about,
          location: payload.location,
          avatarUrl: payload.avatarUrl,
          coverUrl: payload.coverUrl,
          profileCompleteness: completenessScore
        }
      });
    }

    const merged = {
      fullName: payload.fullName ?? existing.fullName ?? "",
      headline: payload.headline ?? existing.headline ?? "",
      about: payload.about ?? existing.about ?? "",
      location: payload.location ?? existing.location ?? "",
      avatarUrl: payload.avatarUrl ?? existing.avatarUrl ?? "",
      coverUrl: payload.coverUrl ?? existing.coverUrl ?? ""
    };

    return this.prisma.userProfile.update({
      where: { userId },
      data: {
        ...payload,
        profileCompleteness: this.computeCompleteness(merged)
      }
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
        cvFiles: true
      }
    });
    if (!user) {
      return {
        completion: 0,
        items: []
      };
    }

    const checklist = [
      {
        key: "full_name",
        label: "Add full name",
        done: Boolean(user.profile?.fullName)
      },
      {
        key: "headline",
        label: "Add professional headline",
        done: Boolean(user.profile?.headline)
      },
      {
        key: "about",
        label: "Add profile summary",
        done: Boolean(user.profile?.about)
      },
      {
        key: "experience",
        label: "Add at least one work experience",
        done: user.workExperiences.length > 0
      },
      {
        key: "education",
        label: "Add at least one education record",
        done: user.educations.length > 0
      },
      {
        key: "skills",
        label: "Add at least 3 skills",
        done: user.userSkills.length >= 3
      },
      {
        key: "cv",
        label: "Upload a CV",
        done: user.cvFiles.length > 0
      }
    ];
    const doneCount = checklist.filter((item) => item.done).length;
    const completion = Math.round((doneCount / checklist.length) * 100);

    return {
      completion,
      items: checklist
    };
  }

  private computeCompleteness(payload: Partial<UpdateProfileDto> & { fullName?: string }): number {
    const weightMap: Array<{ ok: boolean; weight: number }> = [
      { ok: Boolean(payload.fullName), weight: 20 },
      { ok: Boolean(payload.headline), weight: 15 },
      { ok: Boolean(payload.about), weight: 20 },
      { ok: Boolean(payload.location), weight: 10 },
      { ok: Boolean(payload.avatarUrl), weight: 15 },
      { ok: Boolean(payload.coverUrl), weight: 20 }
    ];

    return weightMap.reduce((sum, item) => (item.ok ? sum + item.weight : sum), 0);
  }

  async uploadCv(userId: string, file: Express.Multer.File) {
    const uploaded = await this.storage.upload({
      buffer: file.buffer,
      folder: `cvs/${userId}`,
      originalName: file.originalname,
      contentType: file.mimetype
    });

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
        isPrimary: true
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

  private async ensureOwnership(
    model: "workExperience" | "education",
    id: string,
    userId: string
  ) {
    const record =
      model === "workExperience"
        ? await this.prisma.workExperience.findUnique({ where: { id } })
        : await this.prisma.education.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException("Record not found");
    }
    if (record.userId !== userId) {
      throw new ForbiddenException("Cannot modify another user's record");
    }
  }
}
