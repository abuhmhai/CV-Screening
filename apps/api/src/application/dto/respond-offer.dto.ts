import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class RespondOfferDto {
  @IsIn(["accept", "decline"])
  action!: "accept" | "decline";

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
