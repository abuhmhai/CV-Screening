import { INestApplication, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log("Connected to database successfully via Prisma");
    } catch (error) {
      this.logger.error("Failed to connect to database via Prisma on startup:", error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  enableShutdownHooks(app: INestApplication): void {
    process.on("beforeExit", async () => {
      await app.close();
    });
  }
}
