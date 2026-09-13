import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.join(__dirname, "..");

if (process.env.DATABASE_URL) {
  console.log("[Production Startup] DATABASE_URL detected, running database migrations...");
  try {
    execSync("npx --no-install prisma migrate deploy", {
      cwd: apiRoot,
      stdio: "inherit",
      env: process.env,
      timeout: 60000
    });
    console.log("[Production Startup] Prisma migrations completed successfully.");

    try {
      const { PrismaClient } = await import("@prisma/client");
      const prismaClient = new PrismaClient();
      const count = await prismaClient.job.count().catch(() => 0);
      if (count === 0) {
        console.log("[Production Startup] Database has 0 jobs. Auto-seeding initial jobs and data...");
        execSync("npx ts-node --transpile-only prisma/seed.ts", {
          cwd: apiRoot,
          stdio: "inherit",
          env: process.env,
          timeout: 60000
        });
        console.log("[Production Startup] Database seeded successfully.");
      }
      await prismaClient.$disconnect().catch(() => undefined);
    } catch (seedErr) {
      console.warn("[Production Startup] Seed notice:", seedErr?.message ?? seedErr);
    }
  } catch (error) {
    console.warn(
      "[Production Startup] Migration warning (proceeding to start API server anyway):",
      error?.message ?? error
    );
  }
} else {
  console.warn(
    "[Production Startup] DATABASE_URL is not set. Skipping migrations and starting API server."
  );
}

console.log("[Production Startup] Starting NestJS API server...");
await import("../dist/main.js");
