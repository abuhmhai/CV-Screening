import { Module } from "@nestjs/common";
import { AiScreeningModule } from "../ai-screening/ai-screening.module";
import { ExternalJobsController } from "./external-jobs.controller";
import { ExternalJobsService } from "./external-jobs.service";
import { CrawlerService } from "./crawler/crawler.service";
import { TopCvCrawler } from "./crawler/topcv.crawler";
import { VietnamWorksCrawler } from "./crawler/vietnamworks.crawler";
import { ItViecCrawler } from "./crawler/itviec.crawler";
import { CareerVietCrawler } from "./crawler/careerviet.crawler";

@Module({
  imports: [AiScreeningModule],
  controllers: [ExternalJobsController],
  providers: [ExternalJobsService, CrawlerService, TopCvCrawler, VietnamWorksCrawler, ItViecCrawler, CareerVietCrawler]
})
export class ExternalJobsModule {}
