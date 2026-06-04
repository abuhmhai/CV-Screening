import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

const SOURCES = ["topcv", "vietnamworks", "linkedin"] as const;
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
}
