import { SchemaBuilder, FString, FEmail, FId, FInt, FBoolean, FDateTimeISOZMillis } from "./src/index";
import type { ISchemaInlineObject, ISchemaInferJson } from "./src/index";
import { z } from "zod";

// ── Benchmark runner ────────────────────────────────────────────

const ITERATIONS = 200_000;
const WARMUP = 10_000;

function bench(fn: () => void): { opsPerSec: number; avgUs: number } {
  for (let i = 0; i < WARMUP; i++) fn();
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) fn();
  const ms = performance.now() - start;
  return {
    opsPerSec: Math.round((ITERATIONS / ms) * 1000),
    avgUs: Math.round((ms / ITERATIONS) * 1000 * 100) / 100,
  };
}

function compare(label: string, tyforge: { opsPerSec: number; avgUs: number }, zod: { opsPerSec: number; avgUs: number }) {
  const winner = tyforge.opsPerSec > zod.opsPerSec;
  const ratio = winner
    ? (tyforge.opsPerSec / zod.opsPerSec).toFixed(2)
    : (zod.opsPerSec / tyforge.opsPerSec).toFixed(2);
  console.log(`  ${label}`);
  console.log(`    TyForge: ${tyforge.opsPerSec.toLocaleString()} ops/s (${tyforge.avgUs}µs)`);
  console.log(`    Zod:     ${zod.opsPerSec.toLocaleString()} ops/s (${zod.avgUs}µs)`);
  console.log(`    → ${winner ? "TyForge" : "Zod"} ${ratio}x mais rápido\n`);
}

// ── Helpers ──────────────────────────────────────────────────────

const zodStr = z.string().min(1).max(255);
const zodEmail = z.string().min(5).max(200).email();
const zodInt = z.number().int().min(-2147483648).max(2147483647);
const zodBool = z.boolean();
const zodId = z.string().uuid().min(36).max(36);
const zodDate = z.string().datetime({ precision: 3 });

function makeNestedTyforge(depth: number): ISchemaInlineObject {
  if (depth === 0) return { name: { type: FString }, value: { type: FInt } };
  return { name: { type: FString }, child: makeNestedTyforge(depth - 1) };
}

function makeNestedZod(depth: number): z.ZodObject<Record<string, z.ZodTypeAny>> {
  if (depth === 0) return z.object({ name: zodStr, value: zodInt });
  return z.object({ name: zodStr, child: makeNestedZod(depth - 1) });
}

function makeNestedData(depth: number): Record<string, unknown> {
  if (depth === 0) return { name: "leaf", value: 42 };
  return { name: `level-${depth}`, child: makeNestedData(depth - 1) };
}

// ── Schemas ─────────────────────────────────────────────────────

// 1. Flat object (8 fields)
const flatTyforge = {
  id: { type: FId }, name: { type: FString }, email: { type: FEmail },
  age: { type: FInt }, isActive: { type: FBoolean }, createdAt: { type: FDateTimeISOZMillis },
  address: { street: { type: FString }, city: { type: FString }, zipCode: { type: FString } },
  tags: [{ type: FString }],
} satisfies ISchemaInlineObject;

const flatZod = z.object({
  id: zodId, name: zodStr, email: zodEmail, age: zodInt, isActive: zodBool,
  createdAt: zodDate,
  address: z.object({ street: zodStr, city: zodStr, zipCode: zodStr }),
  tags: z.array(zodStr),
});

const flatData = {
  id: "019d0863-5d45-7246-b6d0-de5098bfd12e", name: "Maria Silva",
  email: "maria@exemplo.com", age: 28, isActive: true,
  createdAt: new Date().toISOString(),
  address: { street: "Rua das Flores, 123", city: "São Paulo", zipCode: "01234-567" },
  tags: ["admin", "premium", "verified"],
};

const flatInvalid = {
  id: "bad", name: "", email: "bad", age: -5, isActive: "yes",
  createdAt: "bad", address: { street: "", city: 123, zipCode: null },
  tags: [123, null, ""],
};

// 2. Large array (100 items)
const arrayTyforge = { items: [{ type: FString }] } satisfies ISchemaInlineObject;
const arrayZod = z.object({ items: z.array(zodStr) });
const arrayData = { items: Array.from({ length: 100 }, (_, i) => `item-${i}`) };

// 3. Large array (1000 items)
const bigArrayData = { items: Array.from({ length: 1000 }, (_, i) => `item-${i}`) };

// 4. Nested 5 levels
const nested5Tyforge = makeNestedTyforge(5);
const nested5Zod = makeNestedZod(5);
const nested5Data = makeNestedData(5);

// 5. Nested 10 levels
const nested10Tyforge = makeNestedTyforge(10);
const nested10Zod = makeNestedZod(10);
const nested10Data = makeNestedData(10);

// 6. Nested 15 levels
const nested15Tyforge = makeNestedTyforge(15);
const nested15Zod = makeNestedZod(15);
const nested15Data = makeNestedData(15);

// 7. Wide object (20 fields)
const wideFields: Record<string, { type: typeof FString }> = {};
const wideZodShape: Record<string, z.ZodString> = {};
const wideData: Record<string, string> = {};
for (let i = 0; i < 20; i++) {
  wideFields[`field${i}`] = { type: FString };
  wideZodShape[`field${i}`] = zodStr;
  wideData[`field${i}`] = `value-${i}`;
}
const wideTyforge = wideFields as ISchemaInlineObject;
const wideZod = z.object(wideZodShape);

// 8. Wide object (50 fields)
const wide50Fields: Record<string, { type: typeof FString }> = {};
const wide50ZodShape: Record<string, z.ZodString> = {};
const wide50Data: Record<string, string> = {};
for (let i = 0; i < 50; i++) {
  wide50Fields[`f${i}`] = { type: FString };
  wide50ZodShape[`f${i}`] = zodStr;
  wide50Data[`f${i}`] = `val-${i}`;
}
const wide50Tyforge = wide50Fields as ISchemaInlineObject;
const wide50Zod = z.object(wide50ZodShape);

// ── Compile all TyForge schemas ─────────────────────────────────

const compiledFlat = SchemaBuilder.compile(flatTyforge);
const compiledArray = SchemaBuilder.compile(arrayTyforge);
const compiledNested5 = SchemaBuilder.compile(nested5Tyforge);
const compiledNested10 = SchemaBuilder.compile(nested10Tyforge);
const compiledNested15 = SchemaBuilder.compile(nested15Tyforge);
const compiledWide = SchemaBuilder.compile(wideTyforge);
const compiledWide50 = SchemaBuilder.compile(wide50Tyforge);

// ── Run ─────────────────────────────────────────────────────────

console.log(`\n🔥 TyForge vs Zod — ${ITERATIONS.toLocaleString()} iterações, ${WARMUP.toLocaleString()} warmup\n`);
console.log("━".repeat(70));

// 1. Flat valid
console.log("\n📊 1. Objeto flat (8 campos + nested address + array tags) — VÁLIDO");
compare("compile vs zod",
  bench(() => compiledFlat.create(flatData as ISchemaInferJson<typeof flatTyforge>, "u")),
  bench(() => flatZod.safeParse(flatData)),
);

// 2. Flat invalid
console.log("📊 2. Objeto flat — INVÁLIDO");
compare("compile vs zod",
  bench(() => compiledFlat.create(flatInvalid as ISchemaInferJson<typeof flatTyforge>, "u")),
  bench(() => flatZod.safeParse(flatInvalid)),
);

// 3. Array 100 items
console.log("📊 3. Array com 100 strings");
compare("compile vs zod",
  bench(() => compiledArray.create(arrayData as ISchemaInferJson<typeof arrayTyforge>, "a")),
  bench(() => arrayZod.safeParse(arrayData)),
);

// 4. Array 1000 items
console.log("📊 4. Array com 1000 strings");
compare("compile vs zod",
  bench(() => compiledArray.create(bigArrayData as ISchemaInferJson<typeof arrayTyforge>, "a")),
  bench(() => arrayZod.safeParse(bigArrayData)),
);

// 5. Nested 5
console.log("📊 5. Objeto aninhado — 5 níveis");
compare("compile vs zod",
  bench(() => compiledNested5.create(nested5Data as ISchemaInferJson<typeof nested5Tyforge>, "n")),
  bench(() => nested5Zod.safeParse(nested5Data)),
);

// 6. Nested 10
console.log("📊 6. Objeto aninhado — 10 níveis");
compare("compile vs zod",
  bench(() => compiledNested10.create(nested10Data as ISchemaInferJson<typeof nested10Tyforge>, "n")),
  bench(() => nested10Zod.safeParse(nested10Data)),
);

// 7. Nested 15
console.log("📊 7. Objeto aninhado — 15 níveis");
compare("compile vs zod",
  bench(() => compiledNested15.create(nested15Data as ISchemaInferJson<typeof nested15Tyforge>, "n")),
  bench(() => nested15Zod.safeParse(nested15Data)),
);

// 8. Wide 20 fields
console.log("📊 8. Objeto largo — 20 campos string");
compare("compile vs zod",
  bench(() => compiledWide.create(wideData as ISchemaInferJson<typeof wideTyforge>, "w")),
  bench(() => wideZod.safeParse(wideData)),
);

// 9. Wide 50 fields
console.log("📊 9. Objeto largo — 50 campos string");
compare("compile vs zod",
  bench(() => compiledWide50.create(wide50Data as ISchemaInferJson<typeof wide50Tyforge>, "w")),
  bench(() => wide50Zod.safeParse(wide50Data)),
);

// 10. Campo simples
const zodEmailPre = z.string().min(5).max(200).email();
console.log("📊 10. Campo simples — FEmail vs z.string().email()");
compare("field vs zod",
  bench(() => FEmail.create("test@example.com")),
  bench(() => zodEmailPre.safeParse("test@example.com")),
);

console.log("━".repeat(70));
console.log("\n✅ Benchmark concluído\n");
