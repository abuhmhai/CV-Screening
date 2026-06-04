import { Module } from "@nestjs/common";
import { AiScreeningModule } from "../ai-screening/ai-screening.module";
import { ExternalJobsController } from "./external-jobs.controller";
import { ExternalJobsService } from "./external-jobs.service";
import { CrawlerService } from "./crawler/crawler.service";
import { TopCvCrawler } from "./crawler/topcv.crawler";
import { VietnamWorksCrawler } from "./crawler/vietnamworks.crawler";

@Module({
  imports: [AiScreeningModule],
  controllers: [ExternalJobsController],
  providers: [ExternalJobsService, CrawlerService, TopCvCrawler, VietnamWorksCrawler]
})
export class ExternalJobsModule {}
