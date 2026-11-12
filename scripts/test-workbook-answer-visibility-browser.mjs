import { build } from "esbuild";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runBrowserTest } from "./browser-test-runner.mjs";

const dir = mkdtempSync(join(tmpdir(), "workbook-answer-visibility-"));
try {
  await build({
    entryPoints: [resolve(process.argv[2] ?? "scripts\\test-workbook-answer-visibility-browser.tsx")],
    bundle: true, outfile: join(dir, "test.js"), jsx: "automatic",
    define: { "import.meta.env": "{}" },
    plugins: [{
      name: "worker-url",
      setup(builder) {
        builder.onResolve({ filter: /\?url$/ }, args => ({ path: args.path, namespace: "test-url" }));
        builder.onLoad({ filter: /.*/, namespace: "test-url" }, () => ({ contents: 'export default "unused-test-worker";', loader: "js" }));
      },
    }],
  });
  writeFileSync(join(dir, "index.html"), '<!doctype html><html><body><div id="fixture"></div><pre id="result">Running</pre><script src="test.js"></script></body></html>');
  await runBrowserTest(dir, { width: 1280, height: 900 });
  await runBrowserTest(dir, { width: 390, height: 844 });
} finally {
  rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
