import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdatePrivacySettingsDto } from "./dto/update-privacy-settings.dto";

export interface PrivacySettings {
  profilePublic: boolean;
  showActivity: boolean;
  allowMessagesFromNonConnections: boolean;
  showOnlinePresence: boolean;
}

const DEFAULTS: PrivacySettings = {
  profilePublic: true,
  showActivity: true,
  allowMessagesFromNonConnections: false,
  showOnlinePresence: true
};

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(userId: string): Promise<PrivacySettings> {
    const row = await this.prisma.privacySettings.findUnique({ where: { userId } });
    if (!row) return DEFAULTS;
    return this.toDto(row);
  }

  async updateSettings(
    userId: string,
    payload: UpdatePrivacySettingsDto
  ): Promise<PrivacySettings> {
    const current = await this.getSettings(userId);
    const merged: PrivacySettings = { ...current, ...payload };

    const data = {
      profileVisibility: merged.profilePublic ? "PUBLIC" : "PRIVATE",
      showActivity: merged.showActivity,
      showConnections: merged.showOnlinePresence,
      allowMessages: merged.allowMessagesFromNonConnections ? "EVERYONE" : "CONNECTIONS"
    };

    const row = await this.prisma.privacySettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data
    });
    return this.toDto(row);
  }

  private toDto(row: {
    profileVisibility: string;
    showActivity: boolean;
    showConnections: boolean;
    allowMessages: string;
  }): PrivacySettings {
    return {
      profilePublic: row.profileVisibility === "PUBLIC",
      showActivity: row.showActivity,
      allowMessagesFromNonConnections: row.allowMessages === "EVERYONE",
      showOnlinePresence: row.showConnections
    };
  }
}
