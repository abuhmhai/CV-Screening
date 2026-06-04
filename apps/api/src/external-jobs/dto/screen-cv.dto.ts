import { IsOptional, IsString, IsUUID, MinLength, ValidateIf } from "class-validator";

export class ScreenCvDto {
  /** Plain CV text (legacy). Prefer cvFileId when the user has uploaded a file. */
  @IsOptional()
  @IsString()
  @ValidateIf((o: ScreenCvDto) => !o.cvFileId)
  @MinLength(20, { message: "CV content is too short to screen." })
  cv?: string;

  /** ID of an uploaded CvFile belonging to the current user. */
  @IsOptional()
  @IsUUID()
  cvFileId?: string;
}
