import { describe, it, after } from "node:test";
import { strict as assert } from "node:assert";
import * as path from "node:path";
import { NoAnyRule } from "../rules/typescript/no-any.rule";
import { NoCastRule } from "../rules/typescript/no-cast.rule";
import { NoNonNullRule } from "../rules/typescript/no-non-null.rule";
import { NoTsIgnoreRule } from "../rules/typescript/no-ts-ignore.rule";
import { NoExportDefaultRule } from "../rules/typescript/no-export-default.rule";
import { NoToJsonLowercaseRule } from "../rules/convention/no-to-json-lowercase.rule";
import { NoNewTypeFieldRule } from "../rules/convention/no-new-type-field.rule";
import { NoMagicHttpStatusRule } from "../rules/convention/no-magic-http-status.rule";
import { NoDeclareRule } from "../rules/convention/no-declare.rule";
import { NoSatisfiesWithoutPrefixRule } from "../rules/convention/no-satisfies-without-prefix.rule";
import { Linter } from "../linter";
import type { IRuleViolation } from "../rule";

const FILE = "src/app/service.ts";
const TEST_FILE = "src/app/__tests__/service.test.ts";

// ── no-any ──────────────────────────────────────────────────────

describe("no-any", () => {
  const rule = new NoAnyRule();

  it("detecta : any", () => {
    assert.notEqual(rule.check("  const x: any = 1;", 1, FILE), null);
  });

  it("detecta Record<string, any>", () => {
    assert.notEqual(rule.check("  type T = Record<string, any>;", 1, FILE), null);
  });

  it("detecta any[]", () => {
    assert.notEqual(rule.check("  const arr: any[] = [];", 1, FILE), null);
  });

  it("ignora comentarios", () => {
    assert.equal(rule.check("  // any is bad", 1, FILE), null);
  });

  it("ignora metodo .any()", () => {
    assert.equal(rule.check("  schema.any()", 1, FILE), null);
  });

  it("ignora arquivos de teste", () => {
    assert.equal(rule.check("  const x: any = 1;", 1, TEST_FILE), null);
  });
});

// ── no-cast ─────────────────────────────────────────────────────

describe("no-cast", () => {
  const rule = new NoCastRule();

  it("detecta as string", () => {
    assert.notEqual(rule.check("  const x = value as string;", 1, FILE), null);
  });

  it("detecta angle bracket assertion", () => {
    assert.notEqual(rule.check("  const x = <MyType>value;", 1, FILE), null);
  });

  it("detecta as unknown", () => {
    assert.notEqual(rule.check("  return result as unknown;", 1, FILE), null);
  });

  it("permite as const", () => {
    assert.equal(rule.check("  const x = [1, 2] as const;", 1, FILE), null);
  });

  it("permite import as alias", () => {
    assert.equal(rule.check("import { foo as bar } from './mod';", 1, FILE), null);
  });

  it("permite export as rename", () => {
    assert.equal(rule.check("export { Foo as Bar } from './mod';", 1, FILE), null);
  });
});

// ── no-non-null ─────────────────────────────────────────────────

describe("no-non-null", () => {
  const rule = new NoNonNullRule();

  it("detecta obj!.prop", () => {
    assert.notEqual(rule.check("  const x = obj!.prop;", 1, FILE), null);
  });

  it("detecta arr![0]", () => {
    assert.notEqual(rule.check("  const x = arr![0];", 1, FILE), null);
  });

  it("detecta value!;", () => {
    assert.notEqual(rule.check("  return value!;", 1, FILE), null);
  });

  it("permite !== comparacao", () => {
    assert.equal(rule.check("  if (x !== null) {}", 1, FILE), null);
  });

  it("permite != comparacao", () => {
    assert.equal(rule.check("  if (x != null) {}", 1, FILE), null);
  });

  it("ignora comentarios", () => {
    assert.equal(rule.check("  // value!.prop", 1, FILE), null);
  });
});

// ── no-ts-ignore ────────────────────────────────────────────────

describe("no-ts-ignore", () => {
  const rule = new NoTsIgnoreRule();

  it("detecta @ts-ignore", () => {
    assert.notEqual(rule.check("  // @ts-ignore", 1, FILE), null);
  });

  it("detecta @ts-expect-error", () => {
    assert.notEqual(rule.check("  // @ts-expect-error", 1, FILE), null);
  });

  it("detecta inline @ts-ignore", () => {
    assert.notEqual(rule.check("  const x = 1; // @ts-ignore", 1, FILE), null);
  });

  it("permite codigo normal", () => {
    assert.equal(rule.check("  const x = 1;", 1, FILE), null);
  });

  it("permite ts-nocheck (nao coberto por esta regra)", () => {
    assert.equal(rule.check("  // @ts-nocheck", 1, FILE), null);
  });

  it("permite comentario sem diretiva ts", () => {
    assert.equal(rule.check("  // ignorar este erro", 1, FILE), null);
  });
});

// ── no-export-default ───────────────────────────────────────────

describe("no-export-default", () => {
  const rule = new NoExportDefaultRule();

  it("detecta export default class", () => {
    assert.notEqual(rule.check("export default class Foo {}", 1, FILE), null);
  });

  it("detecta export default function", () => {
    assert.notEqual(rule.check("export default function main() {}", 1, FILE), null);
  });

  it("detecta export { X as default }", () => {
    assert.notEqual(rule.check("export { Foo as default };", 1, FILE), null);
  });

  it("permite named export", () => {
    assert.equal(rule.check("export class Foo {}", 1, FILE), null);
  });

  it("permite export const", () => {
    assert.equal(rule.check("export const x = 1;", 1, FILE), null);
  });

  it("permite export { X as Y } rename", () => {
    assert.equal(rule.check("export { Foo as Bar };", 1, FILE), null);
  });
});

// ── no-to-json-lowercase ────────────────────────────────────────

describe("no-to-json-lowercase", () => {
  const rule = new NoToJsonLowercaseRule();

  it("detecta .toJson()", () => {
    assert.notEqual(rule.check("  return this.toJson();", 1, FILE), null);
  });

  it("detecta obj.toJson()", () => {
    assert.notEqual(rule.check("  const data = entity.toJson();", 1, FILE), null);
  });

  it("detecta .toJson sem parenteses", () => {
    assert.notEqual(rule.check("  const fn = this.toJson;", 1, FILE), null);
  });

  it("permite .toJSON() correto", () => {
    assert.equal(rule.check("  return this.toJSON();", 1, FILE), null);
  });

  it("permite codigo sem toJson", () => {
    assert.equal(rule.check("  const x = JSON.stringify(data);", 1, FILE), null);
  });

  it("permite toString", () => {
    assert.equal(rule.check("  return this.toString();", 1, FILE), null);
  });
});

// ── no-new-type-field ───────────────────────────────────────────

describe("no-new-type-field", () => {
  const rule = new NoNewTypeFieldRule();

  it("detecta new FString()", () => {
    assert.notEqual(rule.check("  const x = new FString('hello');", 1, FILE), null);
  });

  it("detecta new FEmail()", () => {
    assert.notEqual(rule.check("  const email = new FEmail('a@b.com');", 1, FILE), null);
  });

  it("detecta new FId()", () => {
    assert.notEqual(rule.check("  const id = new FId(uuid);", 1, FILE), null);
  });

  it("permite dentro de format_vo.ts", () => {
    assert.equal(rule.check("  return new FString(value, fieldPath);", 1, "src/type-fields/string.format_vo.ts"), null);
  });

  it("permite dentro de type-field directory", () => {
    assert.equal(rule.check("  return new FString(value, fieldPath);", 1, "src/type-fields/type-field.base.ts"), null);
  });

  it("permite new de classe normal", () => {
    assert.equal(rule.check("  const x = new Map();", 1, FILE), null);
  });
});

// ── no-magic-http-status ────────────────────────────────────────

describe("no-magic-http-status", () => {
  const rule = new NoMagicHttpStatusRule();

  it("detecta status: 200 em contexto HTTP", () => {
    assert.notEqual(rule.check("  return res.status(200);", 1, FILE), null);
  });

  it("detecta status: 404 em contexto HTTP", () => {
    assert.notEqual(rule.check("  if (response.status === 404) {}", 1, FILE), null);
  });

  it("detecta status: 500 em contexto HTTP", () => {
    assert.notEqual(rule.check("  reply.status(500).send(err);", 1, FILE), null);
  });

  it("ignora numeros fora de contexto HTTP", () => {
    assert.equal(rule.check("  const count = 200;", 1, FILE), null);
  });

  it("ignora arquivos de teste", () => {
    assert.equal(rule.check("  expect(res.status).toBe(200);", 1, TEST_FILE), null);
  });

  it("ignora arquivos de definicao HTTP", () => {
    assert.equal(rule.check("  OK = 200,", 1, "src/http-status.ts"), null);
  });
});

// ── no-declare ──────────────────────────────────────────────────

describe("no-declare", () => {
  const rule = new NoDeclareRule();

  it("detecta declare em classe", () => {
    assert.notEqual(rule.check("  declare name: string;", 1, FILE), null);
  });

  it("detecta declare com readonly", () => {
    assert.notEqual(rule.check("  declare readonly id: number;", 1, FILE), null);
  });

  it("detecta declare com tipo complexo", () => {
    assert.notEqual(rule.check("  declare items: Map<string, number>;", 1, FILE), null);
  });

  it("permite declare module", () => {
    assert.equal(rule.check("  declare module 'foo' {}", 1, FILE), null);
  });

  it("permite declare global", () => {
    assert.equal(rule.check("  declare global {}", 1, FILE), null);
  });

  it("permite em arquivo .d.ts", () => {
    assert.equal(rule.check("  declare name: string;", 1, "src/types/globals.d.ts"), null);
  });
});

// ── no-satisfies-without-prefix ─────────────────────────────────

describe("no-satisfies-without-prefix", () => {
  const rule = new NoSatisfiesWithoutPrefixRule();

  it("detecta satisfies Schema", () => {
    assert.notEqual(rule.check("  const x = {} satisfies Schema;", 1, FILE), null);
  });

  it("detecta satisfies Config", () => {
    assert.notEqual(rule.check("  const cfg = {} satisfies Config;", 1, FILE), null);
  });

  it("detecta satisfies Record", () => {
    assert.notEqual(rule.check("  const map = {} satisfies Record;", 1, FILE), null);
  });

  it("permite satisfies ISchema", () => {
    assert.equal(rule.check("  const x = {} satisfies ISchema;", 1, FILE), null);
  });

  it("permite satisfies IConfig", () => {
    assert.equal(rule.check("  const cfg = {} satisfies IConfig;", 1, FILE), null);
  });

  it("permite linhas sem satisfies", () => {
    assert.equal(rule.check("  const x = {};", 1, FILE), null);
  });
});

// ── Linter disable comments ────────────────────────────────────

import * as fs from "node:fs";
import * as os from "node:os";
import { RuleRegistry } from "../rule-registry";
import { DisableCommentParser } from "../disable-comment-parser";

describe("Linter inline disable comments", () => {
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `tyforge-guard-test-${Date.now()}.ts`);

  function lintContent(content: string): IRuleViolation[] {
    fs.writeFileSync(tmpFile, content, "utf-8");
    const registry = new RuleRegistry();
    registry.registerAll([new NoAnyRule(), new NoCastRule()]);
    const linter = new Linter(registry, new DisableCommentParser());
    return linter.checkFile(tmpFile);
  }

  after(() => {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  });

  it("disable-next-line disables all rules", () => {
    const violations = lintContent("// tyforge-guard-disable-next-line\nconst x: any = value as string;");
    assert.equal(violations.length, 0);
  });

  it("disable-next-line with rule name disables only that rule", () => {
    const violations = lintContent("// tyforge-guard-disable-next-line no-any\nconst x: any = value as string;");
    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, "no-cast");
  });

  it("disable-line disables all rules on the same line", () => {
    const violations = lintContent("const x: any = value as string; // tyforge-guard-disable-line");
    assert.equal(violations.length, 0);
  });

  it("disable-line with rule name disables only that rule", () => {
    const violations = lintContent("const x: any = value as string; // tyforge-guard-disable-line no-cast");
    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, "no-any");
  });

  it("without disable comment, both rules fire", () => {
    const violations = lintContent("const x: any = value as string;");
    assert.equal(violations.length, 2);
  });
});
