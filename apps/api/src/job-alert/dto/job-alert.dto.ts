import { AlertFrequency } from "@prisma/client";
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateJobAlertDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  keyword?: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(AlertFrequency)
  frequency?: AlertFrequency;
}

export class UpdateJobAlertDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  keyword?: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(AlertFrequency)
  frequency?: AlertFrequency;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
