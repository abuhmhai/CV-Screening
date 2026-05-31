import { ReactionType } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class ReactPostDto {
  @IsOptional()
  @IsEnum(ReactionType)
  reactionType?: ReactionType;
}
