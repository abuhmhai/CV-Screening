import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards
} from "@nestjs/common";
import { Response } from "express";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { CreateGeneratedCvDto, UpdateGeneratedCvDto } from "./dto/generated-cv.dto";
import { GeneratedCvService } from "./generated-cv.service";

@Controller("users/me/generated-cv")
@UseGuards(JwtAuthGuard)
export class GeneratedCvController {
  constructor(private readonly service: GeneratedCvService) {}

  @Get()
  list(@CurrentUser() user: RequestUser | undefined) {
    return this.service.list(requireUser(user).id);
  }

  @Get(":id")
  getOne(@CurrentUser() user: RequestUser | undefined, @Param("id") id: string) {
    return this.service.getOne(requireUser(user).id, id);
  }

  @Post()
  create(@CurrentUser() user: RequestUser | undefined, @Body() dto: CreateGeneratedCvDto) {
    return this.service.create(requireUser(user).id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: RequestUser | undefined,
    @Param("id") id: string,
    @Body() dto: UpdateGeneratedCvDto
  ) {
    return this.service.update(requireUser(user).id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: RequestUser | undefined, @Param("id") id: string) {
    return this.service.remove(requireUser(user).id, id);
  }

  @Get(":id/export")
  async export(
    @CurrentUser() user: RequestUser | undefined,
    @Param("id") id: string,
    @Res() res: Response
  ) {
    const pdf = await this.service.exportPdf(requireUser(user).id, id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="cv-${id}.pdf"`);
    res.send(pdf);
  }
}
