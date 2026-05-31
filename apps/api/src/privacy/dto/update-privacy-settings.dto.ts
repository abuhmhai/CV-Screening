import { IsBoolean, IsOptional } from "class-validator";

export class UpdatePrivacySettingsDto {
  @IsOptional()
  @IsBoolean()
  profilePublic?: boolean;

  @IsOptional()
  @IsBoolean()
  showActivity?: boolean;

  @IsOptional()
  @IsBoolean()
  allowMessagesFromNonConnections?: boolean;

  @IsOptional()
  @IsBoolean()
  showOnlinePresence?: boolean;
}
