import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Client as MinioClient } from "minio";
import { createHash, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export interface UploadInput {
  buffer: Buffer;
  folder: string;
  originalName: string;
  contentType: string;
}

export interface UploadResult {
  url: string;
  key: string;
  size: number;
}

/**
 * Storage abstraction with two drivers:
 * - "minio": production object storage (S3-compatible)
 * - "local": filesystem fallback served via /api/v1/files (used when MinIO is
 *   not reachable, e.g. local dev without Docker)
 *
 * Driver is chosen by STORAGE_DRIVER; if MinIO init fails it degrades to local.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket = process.env.MINIO_BUCKET_CV ?? "cv-files";
  private readonly publicBase = process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
  private readonly localRoot = process.env.VERCEL
    ? path.join("/tmp", "cv-screening-storage")
    : path.join(process.cwd(), "storage-data");
  private minio: MinioClient | null = null;
  private driver: "minio" | "local" = "local";

  async onModuleInit(): Promise<void> {
    const requested = (process.env.STORAGE_DRIVER ?? "local").toLowerCase();
    if (requested !== "minio") {
      this.logger.log("Storage driver: local filesystem");
      return;
    }

    try {
      this.minio = new MinioClient({
        endPoint: process.env.MINIO_ENDPOINT ?? "127.0.0.1",
        port: Number(process.env.MINIO_PORT ?? 9000),
        useSSL: (process.env.MINIO_USE_SSL ?? "false") === "true",
        accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
        secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin"
      });

      const exists = await this.minio.bucketExists(this.bucket).catch(() => false);
      if (!exists) {
        await this.minio.makeBucket(this.bucket, "us-east-1");
      }
      this.driver = "minio";
      this.logger.log(`Storage driver: MinIO bucket "${this.bucket}"`);
    } catch (error) {
      this.minio = null;
      this.driver = "local";
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`MinIO unavailable (${message}) — using local filesystem fallback`);
    }
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    const safeName = input.originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${input.folder}/${randomUUID()}-${safeName}`;
    const size = input.buffer.length;

    if (this.driver === "minio" && this.minio) {
      try {
        await this.minio.putObject(this.bucket, key, input.buffer, size, {
          "Content-Type": input.contentType
        });
        const url = await this.minio.presignedGetObject(this.bucket, key, 7 * 24 * 60 * 60);
        return { url, key, size };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`MinIO upload failed (${message}) — falling back to local`);
      }
    }

    const absPath = path.join(this.localRoot, key);
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, input.buffer);
    const url = `${this.publicBase}/api/v1/files/${key}`;
    return { url, key, size };
  }

  async readLocal(relativePath: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    const normalized = path.normalize(relativePath).replace(/^([.][.][/\\])+/, "");
    const absolute = path.join(this.localRoot, normalized);
    if (!absolute.startsWith(this.localRoot)) {
      return null;
    }
    try {
      const buffer = await fs.readFile(absolute);
      return { buffer, contentType: guessContentType(absolute) };
    } catch {
      return null;
    }
  }

  static checksum(buffer: Buffer): string {
    return createHash("sha256").update(buffer).digest("hex");
  }
}

function guessContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}
