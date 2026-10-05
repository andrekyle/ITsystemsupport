import { build } from "esbuild";
import { mkdtempSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";

const dir = mkdtempSync(join(tmpdir(), "sync-reload-"));
let browserSocket;
let browserProcess;
let requestId = 0;
function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.addEventListener("open", () => resolve(socket), { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
}
function command(socket, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    const timeout = setTimeout(() => {
      socket.removeEventListener("message", receive);
      reject(new Error(`Browser command timed out: ${method}`));
    }, 60000);
    function receive(event) {
      const message = JSON.parse(event.data);
      if (message.id !== id) return;
      clearTimeout(timeout);
      socket.removeEventListener("message", receive);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
    socket.addEventListener("message", receive);
    socket.send(JSON.stringify({ id, method, params }));
  });
}
try {
  await build({
    entryPoints: [resolve("src/lib/sync.ts")], bundle: true, format: "esm",
    outfile: join(dir, "sync.mjs"),
    plugins: [{ name: "mock-cloud", setup(b) {
      b.onResolve({ filter: /^\.\/supabase$/ }, () => ({ path: "cloud", namespace: "fixture" }));
      b.onResolve({ filter: /^\.\/unitStorage$/ }, () => ({ path: "packs", namespace: "fixture" }));
      b.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "cloud"
        ? "export const supabase = globalThis.testCloud;"
        : "export const isUnitPackKey = () => false; export const receiveUnitPack = () => {}; export const storedUnitPacks = async () => []; export const clearUnitPacks = () => {};" }));
    } }],
  });
  await build({
    entryPoints: [resolve("scripts/test-sync-reload-browser.ts")], bundle: true,
    outfile: join(dir, "test.js"),
  });
  writeFileSync(join(dir, "index.html"), '<!doctype html><html><body><pre id="result">Running</pre><script src="test.js"></script></body></html>');
  const browser = [process.env.CHROME_PATH, "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find(path => path && existsSync(path));
  if (!browser) throw new Error("Set CHROME_PATH to a Chromium browser executable.");
  browserProcess = spawn(browser, ["--headless", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", "--allow-file-access-from-files",
    `--user-data-dir=${join(dir, "profile")}`, "--remote-debugging-port=0", "about:blank"],
  { windowsHide: true });
  const address = await new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error("Browser startup timed out")), 15000);
    browserProcess.once("error", error => { clearTimeout(timeout); reject(error); });
    browserProcess.stderr.on("data", data => {
      output += data;
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
  });
  browserSocket = await connect(address);
  const endpoint = new URL(address);
  const pages = await (await fetch(`http://${endpoint.host}/json/list`)).json();
  const page = await connect(pages.find(page => page.type === "page").webSocketDebuggerUrl);
  try {
    await command(page, "Page.navigate", { url: pathToFileURL(join(dir, "index.html")).href });
    await new Promise(resolve => setTimeout(resolve, 200));
    const result = await command(page, "Runtime.evaluate", {
      expression: `new Promise(resolve => {
        const check = () => {
          if (document.body?.dataset.result) resolve({
            status: document.body.dataset.result,
            message: document.getElementById("result").textContent
          });
          else setTimeout(check, 20);
        };
        check();
      })`,
      awaitPromise: true, returnByValue: true,
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    console.log(result.result.value.message);
    if (result.result.value.status !== "passed") process.exitCode = 1;
  } finally { page.close(); }
} finally {
  if (browserSocket) {
    const exited = new Promise(resolve => browserProcess.once("exit", resolve));
    await command(browserSocket, "Browser.close");
    browserSocket.close();
    await exited;
  } else if (browserProcess) browserProcess.kill();
  rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
