import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MessageGateway } from "./message.gateway";
import { NotificationGateway } from "./notification.gateway";
import { RedisPubSubService } from "./redis-pubsub.service";

@Module({
  imports: [JwtModule.register({})],
  providers: [RedisPubSubService, NotificationGateway, MessageGateway],
  exports: [NotificationGateway, MessageGateway]
})
export class RealtimeModule {}
