import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min
} from "class-validator";

export class SendOfferDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000_000_000)
  salaryAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  salaryCurrency?: string;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  responseDeadline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2000)
  offerLetterUrl?: string;
}
