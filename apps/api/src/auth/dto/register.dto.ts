import { UserRole } from "@prisma/client";
import { IsEmail, IsIn, IsOptional, IsString, MinLength, Matches } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsOptional()
  @IsIn([UserRole.CANDIDATE, UserRole.RECRUITER])
  role?: UserRole;

  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,30}$/)
  username!: string;

  @IsString()
  @Matches(/^\+?[0-9\s-]{8,20}$/)
  phone!: string;
}

export class ForgotPasswordDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s-]{8,20}$/)
  phone?: string;
}
