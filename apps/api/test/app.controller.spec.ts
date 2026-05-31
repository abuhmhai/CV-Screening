import { Test } from "@nestjs/testing";
import { AppController } from "../src/app.controller";

describe("AppController", () => {
  it("returns health payload", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController]
    }).compile();

    const controller = moduleRef.get(AppController);
    const health = controller.health() as { status: string; service: string };

    expect(health.status).toBe("ok");
    expect(health.service).toBe("api");
  });
});
