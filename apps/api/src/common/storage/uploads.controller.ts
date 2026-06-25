import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RequestUser } from "../auth/request-user.type";
import { requireUser } from "../auth/require-user";
import { StorageService } from "./storage.service";

const ALLOWED = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];
const MAX_BYTES = 8 * 1024 * 1024;

@Controller("uploads")
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  @Post("media")
  @UseInterceptors(FileInterceptor("file"))
  async uploadMedia(
    @CurrentUser() user: RequestUser | undefined,
    @UploadedFile() file: Express.Multer.File
  ) {
    const currentUser = requireUser(user);
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    if (!ALLOWED.includes(file.mimetype)) {
      throw new BadRequestException("File type not allowed. Use images, PDF, or Word documents.");
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException("File size exceeds 8MB limit");
    }

    const uploaded = await this.storage.upload({
      buffer: file.buffer,
      folder: `media/${currentUser.id}`,
      originalName: file.originalname,
      contentType: file.mimetype
    });

    return {
      url: uploaded.url,
      name: file.originalname,
      mimeType: file.mimetype,
      size: uploaded.size
    };
  }
}
