import { Result, ok, err, isFailure } from "tyforge/result";
import { Exceptions } from "tyforge/exceptions";
import { TypeGuard } from "tyforge/tools";
import type { FGraphQLDocument } from "tyforge/type-fields";
import { ExceptionGraphQL } from "./exception-graphql";

// Detects GraphQL introspection fields (__schema, __type) to block schema exposure
const INTROSPECTION_REGEX = /\b(__schema|__type)\b/;
// Prototype pollution vectors — must be stripped from user-supplied variables
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const MAX_SANITIZE_DEPTH = 50;

export class ServiceGraphQLSecurity {
  static isIntrospectionQuery(query: FGraphQLDocument): boolean {
    return INTROSPECTION_REGEX.test(query.getValue());
  }

  static sanitizeVariables(
    variables: Record<string, unknown>,
    depth = 0,
  ): Result<Record<string, unknown>, Exceptions> {
    if (depth >= MAX_SANITIZE_DEPTH) {
      return err(
        ExceptionGraphQL.invalidParams(
          "Variables exceed maximum nesting depth.",
        ),
      );
    }
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(variables)) {
      if (DANGEROUS_KEYS.has(key)) continue;
      if (TypeGuard.isRecord(value)) {
        const nested = ServiceGraphQLSecurity.sanitizeVariables(
          value,
          depth + 1,
        );
        if (isFailure(nested)) return nested;
        sanitized[key] = nested.value;
      } else if (Array.isArray(value)) {
        const items: unknown[] = [];
        for (const item of value) {
          if (TypeGuard.isRecord(item)) {
            const nested = ServiceGraphQLSecurity.sanitizeVariables(
              item,
              depth + 1,
            );
            if (isFailure(nested)) return nested;
            items.push(nested.value);
          } else {
            items.push(item);
          }
        }
        sanitized[key] = items;
      } else {
        sanitized[key] = value;
      }
    }
    return ok(sanitized);
  }
}
