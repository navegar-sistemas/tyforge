import { TypeGuard } from "@tyforge/tools/type_guard";

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export class ToolObjectTransform {
  static flatten(obj: Record<string, unknown>, prefix = ""): Map<string, unknown> {
    const result = new Map<string, unknown>();
    for (const [key, val] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (TypeGuard.isRecord(val)) {
        for (const [k, v] of ToolObjectTransform.flatten(val, fullKey)) {
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
      if (keys.some(k => DANGEROUS_KEYS.has(k))) continue;
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
