import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", ".pgdata");

const DB_USER = "postgres";
const DB_PASS = "password";
const DB_PORT = 5432;
const DB_NAME = "cvscreening";

async function ensureDatabase() {
  const client = new pg.Client({
    host: "127.0.0.1",
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: "postgres"
  });
  await client.connect();
  try {
    await client.query(`CREATE DATABASE ${DB_NAME}`);
    console.log(`Created database "${DB_NAME}"`);
  } catch (error) {
    if (error.code !== "42P04") {
      throw error;
    }
    console.log(`Database "${DB_NAME}" already exists`);
  } finally {
    await client.end();
  }
}

async function main() {
  const embedded = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: DB_USER,
    password: DB_PASS,
    port: DB_PORT,
    persistent: true
  });

  console.log("Initialising embedded PostgreSQL...");
  await embedded.initialise();
  await embedded.start();
  console.log(`Embedded PostgreSQL running on 127.0.0.1:${DB_PORT}`);

  await ensureDatabase();
  console.log("Ready. Press Ctrl+C to stop.");

  const shutdown = async () => {
    console.log("\nStopping embedded PostgreSQL...");
    await embedded.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Failed to start embedded PostgreSQL:", error);
  process.exit(1);
});
