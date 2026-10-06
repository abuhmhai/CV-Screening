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
    let schemaStatus = "not_checked";
    const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

    if (!hasDatabaseUrl) {
      dbStatus = "missing_database_url";
      dbError = "DATABASE_URL environment variable is not defined in service variables";
    } else {
      try {
        jobCount = await this.prisma.job.count();
        try {
          await this.prisma.user.findFirst({ select: { username: true, phone: true } });
          schemaStatus = "ok";
        } catch (schemaError) {
          schemaStatus = (schemaError as { code?: string })?.code === "P2022" ? "migration_required" : "error";
        }
      } catch (err) {
        dbStatus = "error";
        dbError = err instanceof Error ? err.message : String(err);
      }
    }

    return {
      status: "ok",
      service: "api",
      revision: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      database: {
        status: dbStatus,
        hasDatabaseUrl,
        jobCount,
        schemaStatus,
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
