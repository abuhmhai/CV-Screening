import { SkillLevel } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpsertSkillDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsEnum(SkillLevel)
  level!: SkillLevel;

  @IsOptional()
  @IsNumber()
  @Min(0)
  yearsExp?: number;
}
