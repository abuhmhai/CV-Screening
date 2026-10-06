import { prepareProduction } from "./prepare-production.mjs";

console.log("[Production Startup] Applying database migrations...");
try {
  prepareProduction();
} catch {
  console.error("[Production Startup] Database migration failed. API startup stopped; check DATABASE_URL, DIRECT_URL and migration logs.");
  process.exit(1);
}

console.log("[Production Startup] Migrations completed. Starting NestJS API...");
await import("../dist/main.js");
