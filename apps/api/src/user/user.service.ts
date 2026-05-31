import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

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
    // Basic mock implementation for local upload handling.
    // In production, we'd use a service like AWS S3 or MinIO to upload.
    // Here we'll generate a dummy URL.
    const fileUrl = `https://storage.local/cvs/${userId}/${Date.now()}-${file.originalname}`;
    
    // Unset primary for existing CVs
    await this.prisma.cvFile.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false }
    });

    return this.prisma.cvFile.create({
      data: {
        userId,
        fileName: file.originalname,
        fileUrl,
        fileSize: file.size,
        isPrimary: true
      }
    });
  }
}
