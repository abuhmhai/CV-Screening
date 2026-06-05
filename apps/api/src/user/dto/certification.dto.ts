import { IsDateString, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class CreateCertificationDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsString()
  @MaxLength(160)
  issuer!: string;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(400)
  credentialUrl?: string;
}

export class UpdateCertificationDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  issuer?: string;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(400)
  credentialUrl?: string;
}
