import { build } from "esbuild";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runBrowserTest } from "./browser-test-runner.mjs";

const dir = mkdtempSync(join(tmpdir(), "sync-reload-"));
try {
  await build({
    entryPoints: [resolve("src/lib/sync.ts")], bundle: true, format: "esm",
    outfile: join(dir, "sync.mjs"),
    plugins: [{ name: "mock-cloud", setup(b) {
      b.onResolve({ filter: /^\.\/supabase$/ }, () => ({ path: "cloud", namespace: "fixture" }));
      b.onResolve({ filter: /^\.\/unitStorage$/ }, () => ({ path: "packs", namespace: "fixture" }));
      b.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "cloud"
        ? "export const supabase = globalThis.testCloud;"
        : "export const isUnitPackKey = () => false; export const receiveUnitPack = () => {}; export const storedUnitPacks = async () => []; export const clearUnitPacks = () => {};" }));
    } }],
  });
  await build({
    entryPoints: [resolve("scripts/test-sync-reload-browser.ts")], bundle: true,
    outfile: join(dir, "test.js"),
  });
  writeFileSync(join(dir, "index.html"), '<!doctype html><html><body><pre id="result">Running</pre><script src="test.js"></script></body></html>');
  await runBrowserTest(dir);
} finally {
  rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
