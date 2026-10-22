import { build } from "esbuild";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runBrowserTest } from "./browser-test-runner.mjs";
const dir = mkdtempSync(join(tmpdir(), "unit-save-slide-count-"));
await build({ entryPoints: [resolve("scripts/test-unit-save-slide-count.tsx")], bundle: true,
  outfile: join(dir, "test.js"), jsx: "automatic", define: { "import.meta.env": "{}" },
  plugins: [{ name: "worker-url", setup(builder) {
    builder.onResolve({ filter: /\?url$/ }, args => ({ path: args.path, namespace: "test-url" }));
    builder.onLoad({ filter: /.*/, namespace: "test-url" }, () => ({ contents: 'export default "unused-test-worker";', loader: "js" }));
  } }],
});
writeFileSync(join(dir, "index.html"), '<!doctype html><div id="fixture"></div><pre id="result">Running</pre><script src="test.js"></script>');
await runBrowserTest(dir);
