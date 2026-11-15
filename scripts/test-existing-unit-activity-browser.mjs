import { build } from "esbuild";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runBrowserTest } from "./browser-test-runner.mjs";
const dir = mkdtempSync(join(tmpdir(), "existing-unit-activity-"));
await build({ entryPoints: [resolve("scripts/test-existing-unit-activity-browser.tsx")], bundle: true,
  outfile: join(dir, "test.js"), jsx: "automatic", loader: { ".svg": "dataurl", ".png": "dataurl", ".jpg": "dataurl", ".webp": "dataurl" }, define: { "import.meta.env": "{}" },
  plugins: [{ name: "test-assets", setup(builder) {
    builder.onResolve({ filter: /\?url$/ }, args => ({ path: args.path, namespace: "test-url" }));
    builder.onLoad({ filter: /.*/, namespace: "test-url" }, () => ({ contents: 'export default "unused-test-worker";', loader: "js" }));
    builder.onResolve({ filter: /^\// }, args => ({ path: resolve("public", args.path.slice(1)) }));
  } }],
});
writeFileSync(join(dir, "index.html"), '<!doctype html><html><link rel="stylesheet" href="test.css"><body><div id="fixture"></div><pre id="result">Running</pre><script src="test.js"></script></body></html>');
await runBrowserTest(dir, { width: 1500, height: 1000 });
