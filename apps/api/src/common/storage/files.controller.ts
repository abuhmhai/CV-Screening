import { Controller, Get, NotFoundException, Param, Res } from "@nestjs/common";
import { Response } from "express";
import { StorageService } from "./storage.service";

/** Serves locally-stored uploads when the storage driver falls back to disk. */
@Controller("files")
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  @Get("*")
  async serve(@Param() params: Record<string, string>, @Res() res: Response) {
    const relativePath = params[0] ?? "";
    const file = await this.storage.readLocal(relativePath);
    if (!file) {
      throw new NotFoundException("File not found");
    }
    res.setHeader("Content-Type", file.contentType);
    res.send(file.buffer);
  }
}
