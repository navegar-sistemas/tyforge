const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const config = getDefaultConfig(__dirname);

const exts = config.resolver?.sourceExts || [];
const filtered = exts.filter((e) => e !== "mjs" && e !== "svg");
config.resolver = {
  ...config.resolver,
  sourceExts: [...filtered, "svg", "mjs"],
  assetExts: (config.resolver?.assetExts || []).filter((e) => e !== "svg"),
  unstable_enablePackageExports: false,
  resolveRequest: (context, moduleName, platform) => {
    const tyforgeBase = path.resolve(__dirname, "node_modules", "tyforge", "dist");
    const tyforgeSubpaths = {
      "tyforge/result": path.join(tyforgeBase, "result", "index.js"),
      "tyforge/type-fields": path.join(tyforgeBase, "type-fields", "index.js"),
      "tyforge/tools": path.join(tyforgeBase, "tools", "index.js"),
      "tyforge/exceptions": path.join(tyforgeBase, "exceptions", "index.js"),
      "tyforge/schema": path.join(tyforgeBase, "schema", "index.js"),
      "tyforge/infrastructure/service-base": path.join(tyforgeBase, "infrastructure", "service.base.js"),
    };
    if (tyforgeSubpaths[moduleName]) {
      return { filePath: tyforgeSubpaths[moduleName], type: "sourceFile" };
    }
    if (moduleName === "uuid") {
      const candidates = [
        path.resolve(__dirname, "node_modules", "tyforge", "node_modules", "uuid", "dist", "index.js"),
        path.resolve(__dirname, "node_modules", "uuid", "dist", "index.js"),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) return { filePath: c, type: "sourceFile" };
      }
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
