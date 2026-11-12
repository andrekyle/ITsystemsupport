import { build } from "esbuild";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runBrowserTest } from "./browser-test-runner.mjs";

const dir = mkdtempSync(join(tmpdir(), "sync-reload-"));
try {
  await build({
    entryPoints: [resolve("src/lib/sync.ts")], bundle: true, format: "esm",
    outfile: join(dir, "sync.mjs"),
    define: { "import.meta.env": "{}" },
    plugins: [{ name: "mock-cloud", setup(b) {
      b.onResolve({ filter: /^\.\/supabase$/ }, () => ({ path: "cloud", namespace: "fixture" }));
      b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
        contents: "export const supabase = globalThis.testCloud;",
      }));
    } }],
  });
  await build({
    entryPoints: [resolve("scripts/test-sync-reload-browser.ts")], bundle: true,
    outfile: join(dir, "test.js"),
  });
  writeFileSync(join(dir, "recovery-export.js"),
    readFileSync(resolve("supabase\\recovery\\export-browser-learner-work.js"), "utf8")
      .replace("'p_mrom4usy_le6ki'", "'sync-progress-test'"));
  writeFileSync(join(dir, "index.html"), '<!doctype html><html><body><pre id="result">Running</pre><script src="test.js"></script></body></html>');
  await runBrowserTest(dir);
} finally {
  rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
