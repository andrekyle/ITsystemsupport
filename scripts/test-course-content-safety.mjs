import { build } from "esbuild";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runBrowserTest } from "./browser-test-runner.mjs";
const dir = mkdtempSync(join(tmpdir(), "course-content-safety-"));
await build({ entryPoints: [resolve("scripts/test-course-content-safety.ts")], bundle: true,
  outfile: join(dir, "test.js"), define: { "import.meta.env": "{}" },
  plugins: [{ name: "mock-cloud", setup(builder) {
    builder.onResolve({ filter: /^\.\/supabase$/ }, () => ({ path: "cloud", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: "export const supabase = { from(...args) { return globalThis.contentCloud.from(...args); } };" }));
  } }],
});
writeFileSync(join(dir, "index.html"), '<!doctype html><pre id="result">Running</pre><script src="test.js"></script>');
await runBrowserTest(dir);
