import { build } from "esbuild";
import { mkdtempSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
const dir = mkdtempSync(join(tmpdir(), "lesson-heading-test-"));
await build({ entryPoints:[resolve(process.argv[2] ?? "scripts/test-lesson-heading-browser.tsx")], bundle:true, outfile:join(dir,"test.js"), jsx:"automatic", external:["/chat-wallpaper-light.svg","/chat-wallpaper-dark.svg"], define:{"import.meta.env":"{}"}, plugins:[{name:"worker-url", setup(b){b.onResolve({filter:/\?url$/},args=>({path:args.path,namespace:"test-url"}));b.onLoad({filter:/.*/,namespace:"test-url"},()=>({contents:'export default "unused-test-worker";',loader:"js"}));}}] });
writeFileSync(join(dir,"index.html"),'<!doctype html><html data-theme="dark"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="test.css"></head><body><div id="fixture" style="padding:24px;max-width:1100px;margin:auto"></div><pre id="result" style="white-space:pre-wrap">Running</pre><script src="test.js"></script></body></html>');
const browser = [process.env.CHROME_PATH,"C:/Program Files/Google/Chrome/Application/chrome.exe","C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(p=>p&&existsSync(p));
if(!browser)throw new Error("Set CHROME_PATH to Chromium.");
for (const width of [1280,390]) {
  const screenshot = join(dir,`heading-${width}.png`);
  const child = spawn(browser,["--headless","--disable-gpu","--no-first-run","--no-default-browser-check",`--user-data-dir=${join(dir,`profile-${width}`)}`,"--remote-debugging-port=0","about:blank"],{windowsHide:true,stdio:["ignore","ignore","pipe"]});
  let socket;
  try {
    const endpoint = await new Promise((resolve,reject)=>{
      const timeout = setTimeout(()=>reject(new Error("Browser startup timed out")),10000);
      let output="";
      child.on("error",error=>{clearTimeout(timeout);reject(error);});
      child.stderr.on("data",data=>{output+=String(data);const match=output.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timeout);resolve(match[1]);}});
    });
    socket = new WebSocket(endpoint);
    await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
    let sequence=0;
    const pending=new Map();
    socket.onmessage=event=>{const result=JSON.parse(String(event.data));const reply=pending.get(result.id);if(reply){pending.delete(result.id);result.error?reply.reject(new Error(result.error.message)):reply.resolve(result.result);}};
    const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params,sessionId}));});
    const {targetId}=await call("Target.createTarget",{url:"about:blank"});
    const {sessionId}=await call("Target.attachToTarget",{targetId,flatten:true});
    await call("Emulation.setDeviceMetricsOverride",{width,height:1000,deviceScaleFactor:1,mobile:width<600},sessionId);
    await call("Page.navigate",{url:pathToFileURL(join(dir,"index.html")).href},sessionId);
    let result;
    for(let attempt=0;attempt<300;attempt++) {
      await new Promise(resolve=>setTimeout(resolve,100));
      const response=await call("Runtime.evaluate",{expression:'JSON.stringify({status:document.body?.dataset.result,message:document.getElementById("result")?.textContent,input:window.__testInput})'},sessionId);
      result=JSON.parse(response.result.value??"{}");
      if(result.input) {
        if(result.input.type==="enter") {
          await call("Input.dispatchKeyEvent",{type:"keyDown",key:"Enter",code:"Enter",windowsVirtualKeyCode:13,text:"\r"},sessionId);
          await call("Input.dispatchKeyEvent",{type:"keyUp",key:"Enter",code:"Enter",windowsVirtualKeyCode:13},sessionId);
        } else await call("Input.insertText",{text:result.input.text},sessionId);
        await call("Runtime.evaluate",{expression:"window.__testInput=null"},sessionId);
      }
      if(result.status)break;
    }
    const capture=await call("Page.captureScreenshot",{format:"png"},sessionId);
    writeFileSync(screenshot,Buffer.from(capture.data,"base64"));
    console.log(`${width}px: ${result?.message ?? "Timed out"}`);
    console.log(screenshot);
    if(result?.status!=="passed") process.exitCode=1;
    await call("Browser.close");
  } finally { socket?.close();child.kill(); }
}
