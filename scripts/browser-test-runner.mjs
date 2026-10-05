import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";

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

/** Use real time: virtual-time DOM dumps can finish before IndexedDB commits. */
export async function runBrowserTest(dir) {
  const browser = [process.env.CHROME_PATH, "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find(path => path && existsSync(path));
  if (!browser) throw new Error("Set CHROME_PATH to a Chromium browser executable.");
  const browserProcess = spawn(browser, ["--headless", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", "--allow-file-access-from-files",
    `--user-data-dir=${join(dir, "profile")}`, "--remote-debugging-port=0", "about:blank"],
  { windowsHide: true });
  let browserSocket;
  try {
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
    } else {
      browserProcess.kill();
    }
  }
}
