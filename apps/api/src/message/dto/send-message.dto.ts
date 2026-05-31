import { IsString, IsUUID, MaxLength } from "class-validator";

export class SendMessageDto {
  @IsUUID()
  conversationId!: string;

  @IsString()
  @MaxLength(5000)
  content!: string;
}
