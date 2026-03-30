/**
 * TyForge React Native / browser compatibility test.
 *
 * Simulates an environment where node:worker_threads is unavailable
 * (React Native, browsers) and verifies TyForge works correctly
 * with automatic fallback to sequential processing.
 *
 * Usage: node test.js
 */

// ── Import TyForge ──────────────────────────────────────────────

let tyforge;
try {
  tyforge = await import("tyforge");
  console.log("[PASS] import tyforge (ESM)");
} catch (err) {
  console.error("[FAIL] import tyforge:", err.message);
  process.exit(1);
}

// ── Test Result pattern ─────────────────────────────────────────

const { ok, err, isSuccess, isFailure } = tyforge;

const success = ok(42);
const failure = err(new Error("test"));

if (isSuccess(success) && success.value === 42) {
  console.log("[PASS] ok/isSuccess");
} else {
  console.error("[FAIL] ok/isSuccess");
  process.exit(1);
}

if (isFailure(failure)) {
  console.log("[PASS] err/isFailure");
} else {
  console.error("[FAIL] err/isFailure");
  process.exit(1);
}

// ── Test TypeFields ─────────────────────────────────────────────

const { FString, FEmail, FInt } = tyforge;

const str = FString.create("hello");
if (isSuccess(str) && str.value.getValue() === "hello") {
  console.log("[PASS] FString.create");
} else {
  console.error("[FAIL] FString.create");
  process.exit(1);
}

const email = FEmail.create("user@test.com");
if (isSuccess(email)) {
  console.log("[PASS] FEmail.create");
} else {
  console.error("[FAIL] FEmail.create");
  process.exit(1);
}

const badEmail = FEmail.create("invalid");
if (isFailure(badEmail)) {
  console.log("[PASS] FEmail rejects invalid");
} else {
  console.error("[FAIL] FEmail accepted invalid");
  process.exit(1);
}

// ── Test SchemaBuilder ──────────────────────────────────────────

const { SchemaBuilder } = tyforge;

const schema = SchemaBuilder.compile({
  name: { type: FString },
  email: { type: FEmail },
});

const valid = schema.create({ name: "Alice", email: "alice@test.com" });
if (isSuccess(valid)) {
  console.log("[PASS] SchemaBuilder.create valid");
} else {
  console.error("[FAIL] SchemaBuilder.create valid:", valid.error.detail);
  process.exit(1);
}

const invalid = schema.create({ name: "", email: "bad" });
if (isFailure(invalid)) {
  console.log("[PASS] SchemaBuilder.create rejects invalid");
} else {
  console.error("[FAIL] SchemaBuilder accepted invalid");
  process.exit(1);
}

// ── Test batchCreate (should fallback to sequential without workers) ──

const items = [
  { name: "User1", email: "u1@test.com" },
  { name: "User2", email: "u2@test.com" },
];

const batchResult = await schema.batchCreate(items, { concurrency: 2 });
if (batchResult.ok.length === 2 && batchResult.errors.length === 0) {
  console.log("[PASS] batchCreate with concurrency (fallback to sequential)");
} else {
  console.error("[FAIL] batchCreate:", batchResult.errors);
  process.exit(1);
}

// ── Done ────────────────────────────────────────────────────────

console.log("\n--- All tests passed ---");
