import { test } from "node:test";
import assert from "node:assert/strict";
import { prepareProduction, startProduction } from "../scripts/prepare-production.mjs";

test("migrations use DIRECT_URL without changing the runtime database URL", () => {
  const env = { DATABASE_URL: "postgresql://runtime/test", DIRECT_URL: "postgresql://migration/test" };
  const calls = [];
  prepareProduction({ env, run: (...args) => calls.push(args) });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], process.execPath);
  assert.deepEqual(calls[0][1].slice(1), ["migrate", "deploy"]);
  assert.equal(calls[0][2].env.DATABASE_URL, env.DIRECT_URL);
  assert.equal(env.DATABASE_URL, "postgresql://runtime/test");
});
test("DATABASE_URL works when no direct URL is configured", () => {
  let migrationUrl;
  prepareProduction({ env: { DATABASE_URL: "postgresql://database/test" }, run: (_cmd, _args, options) => { migrationUrl = options.env.DATABASE_URL; } });
  assert.equal(migrationUrl, "postgresql://database/test");
});
test("missing configuration and failed migrations are reported by the migration runner", () => {
  let called = false;
  assert.throws(() => prepareProduction({ env: {}, run: () => { called = true; } }), /DATABASE_URL/);
  assert.equal(called, false);
  assert.throws(() => prepareProduction({ env: { DATABASE_URL: "postgresql://database/test" }, run: () => { throw new Error("Migration failed"); } }), /Migration failed/);
});
test("a failed migration does not take existing API endpoints offline", async () => {
  let started = false;
  let reported = false;
  await startProduction({ prepare: () => { throw new Error("Migration failed"); }, start: async () => { started = true; }, log: { log() {}, error() { reported = true; } } });
  assert.equal(started, true);
  assert.equal(reported, true);
});
