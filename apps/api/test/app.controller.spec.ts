import { Test } from "@nestjs/testing";
import { AppController } from "../src/app.controller";
import { PrismaService } from "../src/prisma/prisma.service";

describe("AppController", () => {
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

  it.each([
    [null, "ok"],
    [{ code: "P2022" }, "migration_required"]
  ])("reports schema readiness without taking health offline", async (failure, expected) => {
    const previousUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgresql://test";
    try {
      const findFirst = failure ? jest.fn().mockRejectedValue(failure) : jest.fn().mockResolvedValue(null);
      const controller = new AppController({
        job: { count: jest.fn().mockResolvedValue(10) },
        user: { findFirst }
      } as unknown as PrismaService);
      const health = await controller.health();
      expect(health.database.status).toBe("ok");
      expect(health.database.schemaStatus).toBe(expected);
      expect(findFirst).toHaveBeenCalledWith({ select: { username: true, phone: true } });
    } finally {
      if (previousUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousUrl;
    }
  });
});
