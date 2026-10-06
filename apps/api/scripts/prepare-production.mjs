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
    timeout: 180_000
  });
}
