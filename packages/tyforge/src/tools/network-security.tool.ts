import { lookup } from "node:dns/promises";

// RFC 1918, link-local, loopback, CGNAT, and cloud metadata ranges
const PRIVATE_IPV4_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^127\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./,
];

const PRIVATE_IPV6_PATTERNS = [/^::1$/, /^fe80:/i, /^fc00:/i, /^fd/i];

const IPV4_MAPPED_IPV6 = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i;

export class ToolNetworkSecurity {
  static isPrivateIp(ip: string): boolean {
    // IPv4-mapped IPv6 (::ffff:10.0.0.1) — extract IPv4 and re-check
    const mapped = IPV4_MAPPED_IPV6.exec(ip);
    if (mapped) {
      return ToolNetworkSecurity.isPrivateIp(mapped[1]);
    }
    for (const pattern of PRIVATE_IPV4_PATTERNS) {
      if (pattern.test(ip)) return true;
    }
    for (const pattern of PRIVATE_IPV6_PATTERNS) {
      if (pattern.test(ip)) return true;
    }
    return false;
  }

  static async resolveAndValidate(
    hostname: string,
  ): Promise<{ valid: boolean; ip: string }> {
    // Localhost is exempt — development only
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return { valid: true, ip: hostname };
    }
    try {
      const result = await lookup(hostname);
      if (ToolNetworkSecurity.isPrivateIp(result.address)) {
        return { valid: false, ip: result.address };
      }
      return { valid: true, ip: result.address };
    } catch {
      return { valid: false, ip: "" };
    }
  }
}
