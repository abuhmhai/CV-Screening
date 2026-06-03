import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateEducationDto {
  @IsString()
  @MaxLength(160)
  school!: string;

  @IsString()
  @MaxLength(160)
  degree!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  major?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  gpa?: number;

  @IsInt()
  @Min(1950)
  @Max(2100)
  startYear!: number;

  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  endYear?: number;
}

export class UpdateEducationDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  school?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  degree?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  major?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  gpa?: number;

  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  startYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  endYear?: number;
}
