import { build } from "esbuild";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runBrowserTest } from "./browser-test-runner.mjs";

const dir = mkdtempSync(join(tmpdir(), "uploaded-tracker-test-"));
try {
  await build({
    entryPoints: [resolve("scripts/test-uploaded-tracker-browser.tsx")],
    bundle: true, outfile: join(dir, "test.js"), jsx: "automatic",
    define: { "import.meta.env": "{}" },
    plugins: [{
      name: "fixture-worker-url",
      setup(build) {
        build.onResolve({ filter: /\?url$/ }, args => ({ path: args.path, namespace: "fixture-url" }));
        build.onLoad({ filter: /.*/, namespace: "fixture-url" }, () => ({
          contents: 'export default "unused-fixture-worker";', loader: "js",
        }));
      },
    }],
  });
  writeFileSync(join(dir, "index.html"), '<!doctype html><html><head><meta charset="utf-8"></head><body><div id="fixture"></div><pre id="result">Running</pre><script>window.onerror=function(message){document.body.dataset.result="failed";document.getElementById("result").textContent=String(message);};</script><script src="test.js"></script></body></html>');
  await runBrowserTest(dir, { width: 1280, height: 800 });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
