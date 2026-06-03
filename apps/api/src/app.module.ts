import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AiScreeningModule } from "./ai-screening/ai-screening.module";
import { ApplicationModule } from "./application/application.module";
import { AuthModule } from "./auth/auth.module";
import { CompanyModule } from "./company/company.module";
import { FeedModule } from "./feed/feed.module";
import { GeneratedCvModule } from "./generated-cv/generated-cv.module";
import { JobModule } from "./job/job.module";
import { JobAlertModule } from "./job-alert/job-alert.module";
import { SavedJobModule } from "./saved-job/saved-job.module";
import { MessageModule } from "./message/message.module";
import { ModerationModule } from "./moderation/moderation.module";
import { NotificationModule } from "./notification/notification.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PrivacyModule } from "./privacy/privacy.module";
import { RecommendationModule } from "./recommendation/recommendation.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { SearchModule } from "./search/search.module";
import { SocialModule } from "./social/social.module";
import { UserModule } from "./user/user.module";
import { CacheModule } from "./common/cache/cache.module";
import { StorageModule } from "./common/storage/storage.module";
import { RateLimitGuard } from "./common/rate-limit/rate-limit.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    CacheModule,
    StorageModule,
    PrismaModule,
    AiScreeningModule,
    AuthModule,
    UserModule,
    CompanyModule,
    JobModule,
    SavedJobModule,
    JobAlertModule,
    GeneratedCvModule,
    ApplicationModule,
    FeedModule,
    SocialModule,
    SearchModule,
    RecommendationModule,
    ModerationModule,
    PrivacyModule,
    NotificationModule,
    MessageModule,
    RealtimeModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard
    }
  ]
})
export class AppModule {}
