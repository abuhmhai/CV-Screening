import { Controller, Get, NotFoundException, Param, Res } from "@nestjs/common";
import { Response } from "express";
import { StorageService } from "./storage.service";

/** Serves locally-stored uploads when the storage driver falls back to disk. */
@Controller("files")
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  @Get(":folder/:fileName")
  async serve(
    @Param("folder") folder: string,
    @Param("fileName") fileName: string,
    @Res() res: Response
  ) {
    const file = await this.storage.readLocal(`${folder}/${fileName}`);
    if (!file) {
      throw new NotFoundException("File not found");
    }
    res.setHeader("Content-Type", file.contentType);
    res.send(file.buffer);
  }
}
