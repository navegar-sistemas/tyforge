// Browser/React Native stub — replaces batch-parallel.ts via package.json "browser" field.
// Returns null so schema-build.ts falls back to sequential mode.

import type { IParallelProcessor } from "./schema-types";

export function createParallelProcessor(): IParallelProcessor | null {
  return null;
}
