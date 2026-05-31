import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateReportDto {
  @IsIn(["POST", "COMMENT", "PROFILE", "MESSAGE"])
  contentType!: "POST" | "COMMENT" | "PROFILE" | "MESSAGE";

  @IsUUID()
  targetId!: string;

  @IsString()
  @MaxLength(300)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  detail?: string;
}
