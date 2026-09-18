import { Transform, Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

const SOURCES = ["topcv", "vietnamworks", "itviec", "careerviet", "linkedin"] as const;
export type JobSource = (typeof SOURCES)[number];

export class QueryJobsDto {
  @IsOptional()
  @IsIn(SOURCES)
  source?: JobSource;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true || value === "1")
  @IsBoolean()
  savedOnly?: boolean;
}
