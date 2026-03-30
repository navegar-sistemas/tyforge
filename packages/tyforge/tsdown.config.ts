import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    "index": "src/index.ts",
    "result/index": "src/result/index.ts",
    "type-fields/index": "src/type-fields/index.ts",
    "exceptions/index": "src/exceptions/index.ts",
    "schema/index": "src/schema/index.ts",
    "schema/batch-worker": "src/schema/batch-worker.ts",
    "schema/batch-parallel": "src/schema/batch-parallel.ts",
    "schema/batch-parallel.browser": "src/schema/batch-parallel.browser.ts",
    "tools/index": "src/tools/index.ts",
    "lint/index": "src/lint/index.ts",
    "pre-commit/index": "src/pre-commit/index.ts",
    "config/tyforge-config": "src/config/tyforge-config.ts",
  },
  format: "esm",
  dts: true,
  clean: true,
  outDir: "dist",
  target: "es2022",
  platform: "node",
  sourcemap: false,
  unbundle: true,
  fixedExtension: false,
  deps: { neverBundle: ["typescript"] },
});
