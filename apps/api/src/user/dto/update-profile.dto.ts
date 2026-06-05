import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested
} from "class-validator";

export class SocialLinksDto {
  @IsOptional()
  @IsUrl()
  @MaxLength(300)
  github?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(300)
  linkedin?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(300)
  website?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(300)
  portfolio?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(300)
  twitter?: string;
}

export class LanguageEntryDto {
  @IsString()
  @MaxLength(60)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  proficiency?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  about?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsUrl()
  coverUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @ValidateNested({ each: true })
  @Type(() => LanguageEntryDto)
  languages?: LanguageEntryDto[];
}
