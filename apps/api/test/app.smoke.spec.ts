import { Test } from "@nestjs/testing";
import { AppController } from "../src/app.controller";
import { PrismaService } from "../src/prisma/prisma.service";

describe("App smoke", () => {
  it("returns health payload", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: { job: { count: jest.fn().mockResolvedValue(10) } } }]
    }).compile();

    const controller = moduleRef.get(AppController);
    const health = await controller.health();
    expect(health.status).toBe("ok");
    expect(health.service).toBe("api");
  });

  it("returns runtime metrics", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: { job: { count: jest.fn().mockResolvedValue(10) } } }]
    }).compile();

    const controller = moduleRef.get(AppController);
    const metrics = controller.metrics();
    expect(metrics).toHaveProperty("uptimeSeconds");
    expect(metrics).toHaveProperty("rssBytes");
    expect(metrics).toHaveProperty("heapUsedBytes");
  });
});
