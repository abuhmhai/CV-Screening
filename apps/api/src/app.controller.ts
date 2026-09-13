import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("health")
  async health() {
    let dbStatus = "ok";
    let dbError: string | null = null;
    let jobCount = 0;
    const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

    if (!hasDatabaseUrl) {
      dbStatus = "missing_database_url";
      dbError = "DATABASE_URL environment variable is not defined in service variables";
    } else {
      try {
        jobCount = await this.prisma.job.count();
      } catch (err) {
        dbStatus = "error";
        dbError = err instanceof Error ? err.message : String(err);
      }
    }

    return {
      status: "ok",
      service: "api",
      database: {
        status: dbStatus,
        hasDatabaseUrl,
        jobCount,
        error: dbError
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get("metrics")
  metrics() {
    const memory = process.memoryUsage();
    return {
      uptimeSeconds: Math.round(process.uptime()),
      rssBytes: memory.rss,
      heapUsedBytes: memory.heapUsed,
      heapTotalBytes: memory.heapTotal,
      timestamp: new Date().toISOString()
    };
  }
}
