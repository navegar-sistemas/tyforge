// Strips CRLF and null bytes used in HTTP header injection attacks
const UNSAFE_HEADER_CHARS = /[\r\n\0]/g;
// Prototype pollution vectors — prevents __proto__/constructor/prototype key injection
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export class ToolHeaderSecurity {
  static sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (DANGEROUS_KEYS.has(key)) continue;
      const cleanKey = key.replace(UNSAFE_HEADER_CHARS, "");
      if (DANGEROUS_KEYS.has(cleanKey) || cleanKey.length === 0) continue;
      sanitized[cleanKey] = value.replace(UNSAFE_HEADER_CHARS, "");
    }
    return sanitized;
  }
}
