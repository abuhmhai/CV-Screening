import { Module } from "@nestjs/common";
import { CompanyController } from "./company.controller";
import { CompanyPublicController } from "./company-public.controller";
import { CompanyService } from "./company.service";

@Module({
  controllers: [CompanyController, CompanyPublicController],
  providers: [CompanyService]
})
export class CompanyModule {}
