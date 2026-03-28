/**
 * Post-build script: extracts SHA-256 hashes of all inline scripts
 * from the built HTML files and injects them into nginx.conf,
 * replacing 'unsafe-inline' in script-src with exact hashes.
 *
 * Run: node generate-csp.js (after npm run build)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const BUILD_DIR = "build";
const NGINX_CONF = "nginx.conf";

function findHtmlFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findHtmlFiles(fullPath));
    } else if (entry.name.endsWith(".html")) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractInlineScripts(html) {
  const scripts = [];
  const regex = /<script(?:\s[^>]*)?>([^<]+)<\/script>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const content = match[1].trim();
    if (content && !content.startsWith("//")) {
      scripts.push(content);
    }
  }
  return scripts;
}

function sha256Hash(content) {
  return createHash("sha256").update(content).digest("base64");
}

// Collect all unique inline script hashes
const hashes = new Set();
const htmlFiles = findHtmlFiles(BUILD_DIR);

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf-8");
  for (const script of extractInlineScripts(html)) {
    hashes.add(`'sha256-${sha256Hash(script)}'`);
  }
}

if (hashes.size === 0) {
  console.log("No inline scripts found — keeping nginx.conf unchanged");
  process.exit(0);
}

const hashList = [...hashes].join(" ");
console.log(`Found ${hashes.size} unique inline script hash(es): ${hashList}`);

// Replace 'unsafe-inline' in script-src with hashes
let conf = readFileSync(NGINX_CONF, "utf-8");
const original = conf;
conf = conf.replace(
  /script-src 'self' 'unsafe-inline'/g,
  `script-src 'self' ${hashList}`,
);

if (conf === original) {
  console.log("Warning: no 'unsafe-inline' found in script-src — nginx.conf unchanged");
} else {
  writeFileSync(NGINX_CONF, conf, "utf-8");
  const count = (original.match(/script-src 'self' 'unsafe-inline'/g) || []).length;
  console.log(`Updated ${count} script-src directive(s) in nginx.conf`);
}
