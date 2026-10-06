import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "./auth.service";

describe("demo login", () => {
  const demo = { id: "test-user", email: "mai.pham@example.com", role: "CANDIDATE", deletedAt: null };
  let findUnique: jest.Mock;
  let signAsync: jest.Mock;
  let service: AuthService;
  beforeEach(() => {
    findUnique = jest.fn(async query => {
      // A legacy schema cannot project the newly added username/phone columns.
      if (!query.select || query.select.username || query.select.phone) throw new Error("P2022: column missing");
      return demo;
    });
    signAsync = jest.fn().mockResolvedValue("signed-token");
    service = new AuthService({ user: { findUnique } } as unknown as PrismaService, { signAsync } as unknown as JwtService);
  });
  it("issues tokens using only existing identity columns", async () => {
    expect(await service.demoLogin(" Mai.Pham@example.com ")).toMatchObject({ accessToken: "signed-token", refreshToken: "signed-token" });
    expect(findUnique).toHaveBeenCalledWith({ where: { email: "mai.pham@example.com" }, select: { id: true, email: true, role: true, deletedAt: true } });
    expect(signAsync).toHaveBeenCalledWith({ sub: demo.id, email: demo.email, role: demo.role }, expect.any(Object));
  });
  it("rejects missing and deleted accounts without issuing a token", async () => {
    findUnique.mockResolvedValueOnce(null);
    await expect(service.demoLogin(demo.email)).rejects.toBeInstanceOf(UnauthorizedException);
    findUnique.mockResolvedValueOnce({ ...demo, deletedAt: new Date() });
    await expect(service.demoLogin(demo.email)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(signAsync).not.toHaveBeenCalled();
  });
  it("rejects a missing email before querying Prisma", async () => {
    await expect(service.demoLogin(undefined as unknown as string)).rejects.toBeInstanceOf(BadRequestException);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
