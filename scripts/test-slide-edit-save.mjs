import { build } from "esbuild";
import { mkdtempSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const dir = mkdtempSync(join(tmpdir(), "slide-edit-save-"));
await build({ entryPoints: [resolve("scripts/test-slide-edit-save.tsx")], bundle: true,
  outfile: join(dir, "test.js"), jsx: "automatic", define: { "import.meta.env": "{}" } });
writeFileSync(join(dir, "index.html"), '<!doctype html><html><body><div id="fixture"></div><pre id="result">Running</pre><script src="test.js"></script></body></html>');
const browser = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(path => path && existsSync(path));
if (!browser) throw new Error("Set CHROME_PATH to a Chromium browser executable.");
const result = spawnSync(browser, ["--headless", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--user-data-dir=${join(dir, "profile")}`, "--virtual-time-budget=5000", "--dump-dom", pathToFileURL(join(dir, "index.html")).href], { encoding: "utf8", windowsHide: true, timeout: 30000 });
const message = result.stdout?.match(/<pre id="result">([\s\S]*?)<\/pre>/)?.[1];
console.log(message ?? result.error ?? result.stderr);
if (!result.stdout?.includes('data-result="passed"')) process.exitCode = 1;
