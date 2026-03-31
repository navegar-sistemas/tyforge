import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { "index": "src/index.ts" },
  format: "esm",
  dts: true,
  clean: true,
  outDir: "dist",
  target: "es2022",
  platform: "node",
  sourcemap: false,
  fixedExtension: false,
  deps: { neverBundle: ["tyforge", "graphql-request", "graphql"] },
});
