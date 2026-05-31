/**
 * Creates cvscreening database on local PostgreSQL using credentials from apps/api/.env
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(envPath);

const user = process.env.PGUSER ?? "root";
const password = process.env.PGPASSWORD ?? "";
const host = process.env.PGHOST ?? "127.0.0.1";
const port = Number(process.env.PGPORT ?? "5432");
const dbName = process.env.PGDATABASE_NAME ?? "cvscreening";

if (!password) {
  console.error(
    "PGPASSWORD is empty in apps/api/.env\n" +
      "Set the same password you use in DataGrip (user root), e.g.:\n" +
      "  PGPASSWORD=your_password\n" +
      "  DATABASE_URL=postgresql://root:your_password@127.0.0.1:5432/cvscreening"
  );
  process.exit(1);
}

async function main() {
  const client = new pg.Client({
    host,
    port,
    user,
    password: String(password),
    database: "postgres",
    connectionTimeoutMillis: 8000
  });

  await client.connect();
  console.log(`Connected as ${user}@${host}:${port}`);

  try {
    const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Created database "${dbName}"`);
    } else {
      console.log(`Database "${dbName}" already exists`);
    }
  } finally {
    await client.end();
  }

  const encodedPass = encodeURIComponent(password);
  console.log(`DATABASE_URL=postgresql://${user}:${encodedPass}@${host}:${port}/${dbName}`);
}

main().catch((error) => {
  console.error("Database setup failed:", error.message);
  process.exit(1);
});
