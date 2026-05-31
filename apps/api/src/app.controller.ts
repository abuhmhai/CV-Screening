import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get("health")
  health() {
    return {
      status: "ok",
      service: "api",
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
