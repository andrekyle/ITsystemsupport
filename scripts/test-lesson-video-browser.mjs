import { build } from "esbuild";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runBrowserTest } from "./browser-test-runner.mjs";

const dir = mkdtempSync(join(tmpdir(), "lesson-video-test-"));
try {
  await build({
    entryPoints: [resolve(process.argv[2] ?? "scripts/test-lesson-video-browser.tsx")],
    bundle: true, outfile: join(dir, "test.js"), jsx: "automatic",
    external: ["/discovery/*", "/chat-wallpaper-*.svg"],
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
  writeFileSync(join(dir, "index.html"), '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="test.css"></head><body><div id="fixture"></div><pre id="result">Running</pre><script>window.onerror=function(message){document.body.dataset.result="failed";document.getElementById("result").textContent=String(message);};</script><script src="test.js"></script></body></html>');
  for (const viewport of [
    { width: 1280, height: 480 },
    { width: 390, height: 600 },
    { width: 844, height: 390 },
  ]) {
    console.log(`${viewport.width}x${viewport.height}:`);
    await runBrowserTest(dir, viewport);
    if (process.exitCode) break;
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
