import { IsOptional, IsString, IsISO8601, MaxLength } from "class-validator";

export class ScheduleInterviewDto {
  @IsISO8601()
  interviewAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
