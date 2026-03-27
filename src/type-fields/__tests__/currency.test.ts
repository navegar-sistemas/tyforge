import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { FCurrency } from "@tyforge/type-fields/currency.format_vo";
import { FMoney } from "@tyforge/type-fields/money.format_vo";
import { isSuccess, isFailure } from "@tyforge/result/result";

// ── create (decimal input → cents storage) ──────────────────────

describe("FCurrency — create", () => {
  it("converts decimal to cents", () => {
    const result = FCurrency.create(10.50);
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), 1050);
  });

  it("converts zero", () => {
    const result = FCurrency.create(0);
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), 0);
  });

  it("converts negative decimal", () => {
    const result = FCurrency.create(-25.99);
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), -2599);
  });

  it("rounds to nearest cent", () => {
    const result = FCurrency.create(10.555);
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), 1056);
  });

  it("handles integer input", () => {
    const result = FCurrency.create(100);
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), 10000);
  });

  it("rejects non-number", () => {
    const result = FCurrency.create<unknown>("abc");
    assert.ok(isFailure(result));
  });
});

// ── assign (cents from persistence) ─────────────────────────────

describe("FCurrency — assign", () => {
  it("assigns cents directly", () => {
    const result = FCurrency.assign(1050);
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), 1050);
  });
});

// ── createOrThrow ───────────────────────────────────────────────

describe("FCurrency — createOrThrow", () => {
  it("returns instance for valid decimal", () => {
    const c = FCurrency.createOrThrow(50.25);
    assert.equal(c.getValue(), 5025);
  });
});

// ── zero factory ────────────────────────────────────────────────

describe("FCurrency — zero", () => {
  it("creates zero", () => {
    const z = FCurrency.zero();
    assert.equal(z.getValue(), 0);
    assert.ok(z.isZero());
  });
});

// ── decimal conversion ──────────────────────────────────────────

describe("FCurrency — toDecimalValue", () => {
  it("converts cents to decimal", () => {
    const c = FCurrency.createOrThrow(10.50);
    assert.equal(c.toDecimalValue(), 10.50);
  });

  it("negative cents to decimal", () => {
    const c = FCurrency.createOrThrow(-5.25);
    assert.equal(c.toDecimalValue(), -5.25);
  });
});

// ── inherits arithmetic from FMoney ─────────────────────────────

describe("FCurrency — arithmetic (inherited)", () => {
  it("add two values", () => {
    const a = FCurrency.createOrThrow(10.50);
    const b = FCurrency.createOrThrow(5.25);
    const result = a.add(b);
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), 1575);
  });

  it("subtract", () => {
    const a = FCurrency.createOrThrow(10);
    const b = FCurrency.createOrThrow(25);
    const result = a.subtract(b);
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), -1500);
  });

  it("0.1 + 0.2 is safe (integer cents)", () => {
    const a = FCurrency.createOrThrow(0.1);
    const b = FCurrency.createOrThrow(0.2);
    const result = a.add(b);
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), 30);
    assert.equal(result.value.toDecimal(), 0.30);
  });
});

// ── inherits comparisons from FMoney ────────────────────────────

describe("FCurrency — comparisons (inherited)", () => {
  it("isZero, isPositive, isNegative", () => {
    assert.ok(FCurrency.zero().isZero());
    assert.ok(FCurrency.createOrThrow(10).isPositive());
    assert.ok(FCurrency.createOrThrow(-10).isNegative());
  });

  it("isGreaterThan, isLessThan, isEqualTo", () => {
    const a = FCurrency.createOrThrow(100);
    const b = FCurrency.createOrThrow(50);
    assert.ok(a.isGreaterThan(b));
    assert.ok(b.isLessThan(a));
    assert.ok(a.isEqualTo(FCurrency.createOrThrow(100)));
  });
});

// ── formatting ──────────────────────────────────────────────────

describe("FCurrency — formatting", () => {
  it("formatted returns decimal string", () => {
    assert.equal(FCurrency.createOrThrow(10).formatted(), "10.00");
    assert.equal(FCurrency.createOrThrow(10.5).formatted(), "10.50");
    assert.equal(FCurrency.createOrThrow(10.99).formatted(), "10.99");
  });

  it("toString returns decimal string", () => {
    assert.equal(FCurrency.createOrThrow(0).toString(), "0.00");
  });

  it("toCents via getValue", () => {
    assert.equal(FCurrency.createOrThrow(10.50).getValue(), 1050);
  });
});

// ── is instance of FMoney ───────────────────────────────────────

describe("FCurrency — inheritance", () => {
  it("is instance of FMoney", () => {
    const c = FCurrency.createOrThrow(10);
    assert.ok(c instanceof FMoney);
  });
});
