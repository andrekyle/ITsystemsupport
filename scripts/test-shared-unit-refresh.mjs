import { build } from "esbuild";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runBrowserTest } from "./browser-test-runner.mjs";

const dir = mkdtempSync(join(tmpdir(), "shared-unit-refresh-"));
await build({
  entryPoints: [resolve("scripts/test-shared-unit-refresh.tsx")], bundle: true,
  outfile: join(dir, "test.js"), jsx: "automatic", define: { "import.meta.env": "{}" },
  plugins: [{ name: "mock-cloud", setup(builder) {
    builder.onResolve({ filter: /^\.\/supabase$/ }, () => ({ path: "cloud", namespace: "fixture" }));
    builder.onResolve({ filter: /^\.\/sync$/ }, () => ({ path: "pending", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "cloud"
      ? "export const supabase = { from(...args) { return globalThis.testCloud.from(...args); } };"
      : "export const hasPendingCloudWrite = () => globalThis.testPending();" }));
  } }],
});
writeFileSync(join(dir, "index.html"), '<!doctype html><div id="fixture"></div><pre id="result">Running</pre><script src="test.js"></script>');
await runBrowserTest(dir);
