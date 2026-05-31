import { CacheService } from "./cache.service";

describe("CacheService", () => {
  it("hashKey is stable for same input", () => {
    const a = CacheService.hashKey(["react", "jobs", "10"]);
    const b = CacheService.hashKey(["react", "jobs", "10"]);
    expect(a).toBe(b);
    expect(a).toHaveLength(24);
  });

  it("hashKey differs for different input", () => {
    const a = CacheService.hashKey(["react", "jobs", "10"]);
    const b = CacheService.hashKey(["vue", "jobs", "10"]);
    expect(a).not.toBe(b);
  });

  it("stores and retrieves values in memory fallback", async () => {
    const service = new CacheService();
    await service.set("test:key", { ok: true }, 60);
    const value = await service.get<{ ok: boolean }>("test:key");
    expect(value).toEqual({ ok: true });
    await service.onModuleDestroy();
  });
});
