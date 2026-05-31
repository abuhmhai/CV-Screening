import { Injectable } from "@nestjs/common";
import { UpdatePrivacySettingsDto } from "./dto/update-privacy-settings.dto";

export interface PrivacySettings {
  profilePublic: boolean;
  showActivity: boolean;
  allowMessagesFromNonConnections: boolean;
  showOnlinePresence: boolean;
}

@Injectable()
export class PrivacyService {
  private readonly settingsStore = new Map<string, PrivacySettings>();

  getSettings(userId: string): PrivacySettings {
    return (
      this.settingsStore.get(userId) ?? {
        profilePublic: true,
        showActivity: true,
        allowMessagesFromNonConnections: false,
        showOnlinePresence: true
      }
    );
  }

  updateSettings(userId: string, payload: UpdatePrivacySettingsDto): PrivacySettings {
    const current = this.getSettings(userId);
    const merged: PrivacySettings = {
      ...current,
      ...payload
    };
    this.settingsStore.set(userId, merged);
    return merged;
  }
}
