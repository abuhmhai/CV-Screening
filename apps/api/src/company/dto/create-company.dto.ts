import { IsOptional, IsString, Length } from "class-validator";

export class CreateCompanyDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsString()
  @Length(2, 120)
  slug!: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
