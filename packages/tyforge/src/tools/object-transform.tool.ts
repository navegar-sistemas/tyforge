import { TypeGuard } from "@tyforge/tools/type_guard";

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export class ToolObjectTransform {
  static flatten(
    obj: Record<string, unknown>,
    prefix = "",
    maxDepth = 100,
    depth = 0,
  ): Map<string, unknown> {
    const safeMaxDepth = Math.max(1, maxDepth);
    const result = new Map<string, unknown>();
    for (const [key, val] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (TypeGuard.isRecord(val) && depth < safeMaxDepth) {
        for (const [k, v] of ToolObjectTransform.flatten(
          val,
          fullKey,
          safeMaxDepth,
          depth + 1,
        )) {
          result.set(k, v);
        }
      } else {
        result.set(fullKey, val);
      }
    }
    return result;
  }

  static unflatten(flat: Map<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, val] of flat) {
      const keys = key.split(".");
      if (keys.some((k) => DANGEROUS_KEYS.has(k))) continue;
      let current = result;
      for (let i = 0; i < keys.length - 1; i++) {
        const existing = current[keys[i]];
        if (TypeGuard.isRecord(existing)) {
          current = existing;
        } else {
          const next: Record<string, unknown> = {};
          current[keys[i]] = next;
          current = next;
        }
      }
      current[keys[keys.length - 1]] = val;
    }
    return result;
  }
}
