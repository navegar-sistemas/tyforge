import { SchemaBuilder, FString, FEmail, FId, FInt, FBoolean, FDateTimeISOZMillis } from "./dist";
import type { Schema, InferJson } from "./dist";
import { z } from "zod";

// ── Benchmark runner ────────────────────────────────────────────

const ITERATIONS = 200_000;
const WARMUP = 10_000;
const RUNS = 3;

function bench(fn: () => void): { opsPerSec: number; avgUs: number } {
  for (let i = 0; i < WARMUP; i++) fn();

  const results: number[] = [];
  for (let r = 0; r < RUNS; r++) {
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) fn();
    results.push(performance.now() - start);
  }

  results.sort((a, b) => a - b);
  const median = results[Math.floor(RUNS / 2)];

  return {
    opsPerSec: Math.round((ITERATIONS / median) * 1000),
    avgUs: Math.round((median / ITERATIONS) * 1000 * 100) / 100,
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

function makeNestedTyforge(depth: number): Schema {
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

// Flat object (8 fields + nested + array)
const flatTyforge = {
  id: { type: FId }, name: { type: FString }, email: { type: FEmail },
  age: { type: FInt }, isActive: { type: FBoolean }, createdAt: { type: FDateTimeISOZMillis },
  address: { street: { type: FString }, city: { type: FString }, zipCode: { type: FString } },
  tags: [{ type: FString }],
} satisfies Schema;

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

// Invalid data — erro no PRIMEIRO campo (favorece early-return)
const flatInvalidFirst = {
  id: "bad", name: "Maria", email: "maria@ex.com", age: 28, isActive: true,
  createdAt: new Date().toISOString(),
  address: { street: "Rua X", city: "SP", zipCode: "00000" },
  tags: ["ok"],
};

// Invalid data — erro no ÚLTIMO campo (justo, ambos processam tudo)
const flatInvalidLast = {
  id: "019d0863-5d45-7246-b6d0-de5098bfd12e", name: "Maria Silva",
  email: "maria@exemplo.com", age: 28, isActive: true,
  createdAt: new Date().toISOString(),
  address: { street: "Rua das Flores, 123", city: "São Paulo", zipCode: "01234-567" },
  tags: ["admin", "", "verified"],
};

// Array schemas
const arrayTyforge = { items: [{ type: FString }] } satisfies Schema;
const arrayZod = z.object({ items: z.array(zodStr) });
const arrayData100 = { items: Array.from({ length: 100 }, (_, i) => `item-${i}`) };
const arrayData1000 = { items: Array.from({ length: 1000 }, (_, i) => `item-${i}`) };

// Nested schemas
const nested5Tyforge = makeNestedTyforge(5);
const nested5Zod = makeNestedZod(5);
const nested5Data = makeNestedData(5);

const nested10Tyforge = makeNestedTyforge(10);
const nested10Zod = makeNestedZod(10);
const nested10Data = makeNestedData(10);

// Wide objects (20 and 50 fields)
const wideFields: Record<string, { type: typeof FString }> = {};
const wideZodShape: Record<string, z.ZodString> = {};
const wideData: Record<string, string> = {};
for (let i = 0; i < 20; i++) {
  wideFields[`field${i}`] = { type: FString };
  wideZodShape[`field${i}`] = zodStr;
  wideData[`field${i}`] = `value-${i}`;
}
const wideTyforge = wideFields as Schema;
const wideZod = z.object(wideZodShape);

const wide50Fields: Record<string, { type: typeof FString }> = {};
const wide50ZodShape: Record<string, z.ZodString> = {};
const wide50Data: Record<string, string> = {};
for (let i = 0; i < 50; i++) {
  wide50Fields[`f${i}`] = { type: FString };
  wide50ZodShape[`f${i}`] = zodStr;
  wide50Data[`f${i}`] = `val-${i}`;
}
const wide50Tyforge = wide50Fields as Schema;
const wide50Zod = z.object(wide50ZodShape);

// ── Compile schemas ─────────────────────────────────────────────

const compiledFlat = SchemaBuilder.compile(flatTyforge);
const compiledArray = SchemaBuilder.compile(arrayTyforge);
const compiledNested5 = SchemaBuilder.compile(nested5Tyforge);
const compiledNested10 = SchemaBuilder.compile(nested10Tyforge);
const compiledWide = SchemaBuilder.compile(wideTyforge);
const compiledWide50 = SchemaBuilder.compile(wide50Tyforge);

// ── Run ─────────────────────────────────────────────────────────

console.log(`\n🔥 TyForge vs Zod — ${ITERATIONS.toLocaleString()} iterações × ${RUNS} rodadas (mediana), ${WARMUP.toLocaleString()} warmup`);
console.log(`\n   Nota: TyForge retorna TypeField instances (getValue, formatted, equals, toJSON).`);
console.log(`         Zod retorna valores primitivos. Trade-offs diferentes.\n`);
console.log("━".repeat(70));

// 1. Flat valid
console.log("\n📊 1. Objeto flat (8 campos + nested + array) — VÁLIDO");
compare("compile vs safeParse",
  bench(() => compiledFlat.create(flatData as InferJson<typeof flatTyforge>)),
  bench(() => flatZod.safeParse(flatData)),
);

// 2. Flat invalid — erro no primeiro campo (favorece early-return)
console.log("📊 2. Erro no PRIMEIRO campo (early-return)");
console.log("   ⚠ TyForge para no 1º erro, Zod coleta todos — cenário favorece TyForge");
compare("compile vs safeParse",
  bench(() => compiledFlat.create(flatInvalidFirst as unknown as InferJson<typeof flatTyforge>)),
  bench(() => flatZod.safeParse(flatInvalidFirst)),
);

// 3. Flat invalid — erro no último campo (justo)
console.log("📊 3. Erro no ÚLTIMO campo (ambos processam tudo)");
compare("compile vs safeParse",
  bench(() => compiledFlat.create(flatInvalidLast as unknown as InferJson<typeof flatTyforge>)),
  bench(() => flatZod.safeParse(flatInvalidLast)),
);

// 4. Array 100 items
console.log("📊 4. Array com 100 strings");
compare("compile vs safeParse",
  bench(() => compiledArray.create(arrayData100 as InferJson<typeof arrayTyforge>)),
  bench(() => arrayZod.safeParse(arrayData100)),
);

// 5. Array 1000 items
console.log("📊 5. Array com 1000 strings");
compare("compile vs safeParse",
  bench(() => compiledArray.create(arrayData1000 as InferJson<typeof arrayTyforge>)),
  bench(() => arrayZod.safeParse(arrayData1000)),
);

// 6. Nested 5
console.log("📊 6. Objeto aninhado — 5 níveis");
compare("compile vs safeParse",
  bench(() => compiledNested5.create(nested5Data as InferJson<typeof nested5Tyforge>)),
  bench(() => nested5Zod.safeParse(nested5Data)),
);

// 7. Nested 10
console.log("📊 7. Objeto aninhado — 10 níveis");
compare("compile vs safeParse",
  bench(() => compiledNested10.create(nested10Data as InferJson<typeof nested10Tyforge>)),
  bench(() => nested10Zod.safeParse(nested10Data)),
);

// 8. Wide 20 fields
console.log("📊 8. Objeto largo — 20 campos string");
compare("compile vs safeParse",
  bench(() => compiledWide.create(wideData as InferJson<typeof wideTyforge>)),
  bench(() => wideZod.safeParse(wideData)),
);

// 9. Wide 50 fields
console.log("📊 9. Objeto largo — 50 campos string");
compare("compile vs safeParse",
  bench(() => compiledWide50.create(wide50Data as InferJson<typeof wide50Tyforge>)),
  bench(() => wide50Zod.safeParse(wide50Data)),
);

// 10. Campo simples
const zodEmailPre = z.string().min(5).max(200).email();
console.log("📊 10. Campo simples — FEmail.create vs z.string().email()");
compare("field vs safeParse",
  bench(() => FEmail.create("test@example.com")),
  bench(() => zodEmailPre.safeParse("test@example.com")),
);

// 11. Tempo de compilação
console.log("📊 11. Tempo de compilação do schema flat");
compare("compile vs z.object",
  bench(() => SchemaBuilder.compile(flatTyforge)),
  bench(() => z.object({
    id: zodId, name: zodStr, email: zodEmail, age: zodInt, isActive: zodBool,
    createdAt: zodDate,
    address: z.object({ street: zodStr, city: zodStr, zipCode: zodStr }),
    tags: z.array(zodStr),
  })),
);

console.log("━".repeat(70));
console.log("\n✅ Benchmark concluído\n");
