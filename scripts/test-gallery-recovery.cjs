const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const source = ts.createSourceFile("store.ts", fs.readFileSync("src/store.ts", "utf8"), ts.ScriptTarget.Latest, true);
const functions = source.statements.filter(node => ts.isFunctionDeclaration(node) && ["recoverMemoryFiles", "pullMemories"].includes(node.name?.text)).map(node => node.getText(source)).join("\n");
const folders = source.statements.find(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(declaration => declaration.name.getText(source) === "MEMORIES_FOLDERS")).getText(source);
const code = ts.transpileModule(`${folders}\n${functions}`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
function fixture(tenant, objects, failure = false) {
  const calls = [];
  const client = { storage: { from() { return { async list(folder, { offset, limit }) {
    calls.push(folder);
    return failure ? { error: new Error("Offline") } : { data: (objects[folder] ?? []).slice(offset, offset + limit), error: null };
  } }; } }, from() { return { select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: { value: "[]" }, error: null }; } }; } };
  const helpers = new Function("TENANT_ID", "supabase", "MEMORIES_KEY", "read", `${code}; return {recoverMemoryFiles,pullMemories};`)(tenant, client, "itss.memories.shared", () => []);
  return { ...helpers, calls };
}
async function main() {
  const legacy = Array.from({ length: 11 }, (_, index) => ({ name: `photo${index}.jpg`, created_at: "2026-08-01T10:00:00Z" }));
  const investec = fixture("investec", { "shared/memories": legacy });
  const recovered = await investec.pullMemories(true);
  assert.equal(recovered.length, 11, "An empty gallery index must recover all legacy storage photos");
  assert(recovered.every(photo => photo.path.startsWith("shared/memories/")));
  const known = { ...recovered[0], by: "Original uploader", byId: "profile-1" };
  const duplicate = fixture("investec", { "investec/shared/memories": [legacy[0]], "shared/memories": legacy });
  const merged = await duplicate.recoverMemoryFiles([known]);
  assert.equal(merged.length, 11, "Copies in old and new folders must not duplicate photo cards");
  assert.equal(merged[0].by, "Original uploader");
  const discovery = fixture("discovery", { "shared/memories": legacy });
  assert.equal((await discovery.pullMemories(true)).length, 0);
  assert.deepEqual(discovery.calls, ["discovery/shared/memories"], "Discovery must never scan Investec's legacy shared gallery");
  const offline = fixture("investec", {}, true);
  await assert.rejects(offline.pullMemories(true), /could not be loaded/);
  assert.equal(await offline.pullMemories(), null, "Non-strict reads retain the local fallback when offline");

  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const page = ts.createSourceFile("Memories.tsx", fs.readFileSync("src/pages/Memories.tsx", "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const component = page.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "MemoriesPage").getText(page);
  const pageCode = ts.transpileModule(component, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  for (const [loading, loadError] of [[true, ""], [false, "Network unavailable"]]) {
    const exports = {};
    new Function("require", "exports", "useState", "useRef", "useMemo", "isStaff", "useMemories", "Icon", pageCode)(require, exports, React.useState, React.useRef, React.useMemo,
      () => true, () => ({ photos: [], urls: {}, loading, loadError, refreshPhotos() {} }), () => null);
    const html = renderToStaticMarkup(React.createElement(exports.MemoriesPage, { profile: { id: "admin", role: "Admin" } }));
    assert(!html.includes("No pictures yet"), "Loading/failure must not be presented as an empty gallery");
    assert(html.includes(loading ? "Loading gallery photos" : "Network unavailable"));
  }
  console.log("Gallery recovery passed: 11 legacy images restored, metadata retained, duplicates prevented, tenants isolated, and loading/errors displayed accurately.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
