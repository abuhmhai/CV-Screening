import { ConnectionStatus } from "@prisma/client";
import { IsEnum } from "class-validator";

export class UpdateConnectionStatusDto {
  @IsEnum(ConnectionStatus)
  status!: ConnectionStatus;
}
