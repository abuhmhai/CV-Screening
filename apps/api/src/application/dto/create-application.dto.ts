import { IsOptional, IsString, IsUUID } from "class-validator";

export class CreateApplicationDto {
  @IsUUID()
  jobId!: string;

  @IsUUID()
  cvFileId!: string;

  @IsOptional()
  @IsString()
  coverLetter?: string;
}
