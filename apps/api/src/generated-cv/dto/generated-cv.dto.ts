import { IsBoolean, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateGeneratedCvDto {
  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsObject()
  data!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateGeneratedCvDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
