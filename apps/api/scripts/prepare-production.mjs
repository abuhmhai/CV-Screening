import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function prepareProduction({ env = process.env, run = execFileSync } = {}) {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required to start the production API");
  // Prefer the direct/session connection for migrations, keeping the runtime URL unchanged.
  const migrationEnv = { ...env, DATABASE_URL: env.DIRECT_URL || env.DATABASE_URL };
  run(process.execPath, [require.resolve("prisma/build/index.js"), "migrate", "deploy"], {
    cwd: apiRoot,
    env: migrationEnv,
    stdio: "inherit",
    timeout: 45_000
  });
}

export async function startProduction({ prepare = prepareProduction, start = () => import("../dist/main.js"), log = console } = {}) {
  log.log("[Production Startup] Applying database migrations...");
  try {
    prepare();
    log.log("[Production Startup] Migrations completed.");
  } catch {
    log.error("[Production Startup] Migration failed; check DATABASE_URL, DIRECT_URL and Prisma logs. Starting API so existing schema-compatible endpoints remain available.");
  }
  log.log("[Production Startup] Starting NestJS API...");
  await start();
}
