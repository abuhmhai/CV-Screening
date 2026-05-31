import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min
} from "class-validator";

export class CreateJobDto {
  @IsUUID()
  companyId!: string;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  jobType!: string;

  @IsString()
  level!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSalary?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxSalary?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsArray()
  requiredSkills!: string[];
}
