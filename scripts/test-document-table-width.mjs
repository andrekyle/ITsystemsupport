import { build } from "esbuild";
import { mkdtempSync, writeFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runBrowserTest } from "./browser-test-runner.mjs";

const dir = mkdtempSync(join(tmpdir(), "document-table-width-"));
try {
  await build({
    entryPoints: [resolve("scripts\\test-document-table-width-browser.tsx")],
    bundle: true, outfile: join(dir, "test.js"), jsx: "automatic",
    plugins: [{ name: "public-assets", setup(builder) {
      builder.onResolve({ filter: /^\// }, args => ({ path: args.path, external: true }));
    } }],
    define: { "import.meta.env": "{}" },
  });
  writeFileSync(join(dir, "index.html"), '<!doctype html><html><head><link rel="stylesheet" href="test.css"></head><body><div id="fixture"></div><pre id="result">Running</pre><script>window.addEventListener("error",event=>{document.body.dataset.result="failed";document.getElementById("result").textContent=event.message;});</script><script src="test.js"></script></body></html>');
  for (const width of [1280, 390]) {
    const pdfPath = join(dir, `workbook-${width}.pdf`);
    await runBrowserTest(dir, { width, height: 900 }, { media: "print", pdfPath });
    if (!process.exitCode && statSync(pdfPath).size < 1000) throw new Error("The generated PDF is empty.");
  }
} finally {
  rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
