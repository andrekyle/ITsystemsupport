import { build } from "esbuild";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runBrowserTest } from "./browser-test-runner.mjs";

const dir = mkdtempSync(join(tmpdir(), "onboarding-explorer-"));
try {
  await build({
    entryPoints: [resolve("scripts/test-onboarding-explorer-browser.tsx")],
    bundle: true, outfile: join(dir, "test.js"), jsx: "automatic",
    external: ["/chat-wallpaper-*.svg"],
    define: { "import.meta.env": "{}" },
  });
  writeFileSync(join(dir, "index.html"), '<!doctype html><html><head><link rel="stylesheet" href="test.css"></head><body><div id="fixture"></div><pre id="result">Running</pre><script src="test.js"></script></body></html>');
  await runBrowserTest(dir);
} finally {
  rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
