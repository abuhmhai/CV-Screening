import { IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { PostVisibility } from "@prisma/client";

export class CreatePostDto {
  @IsString()
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsArray()
  mediaUrls?: string[];

  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;
}
