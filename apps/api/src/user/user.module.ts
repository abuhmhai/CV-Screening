import { Module } from "@nestjs/common";
import { RecommendationModule } from "../recommendation/recommendation.module";
import { PublicUserController } from "./public-user.controller";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [RecommendationModule],
  controllers: [UserController, PublicUserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
