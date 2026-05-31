import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateCommentDto {
  @IsString()
  @MaxLength(1200)
  content!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
