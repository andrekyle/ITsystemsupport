import assert from "node:assert/strict";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import handler from "../api/qualification-pack";
import { packCourseDetails, readQualificationDraft } from "../src/lib/qualificationPack";
import { validateCourseDetails } from "../src/lib/courseMetadata";

process.env.OPENAI_API_KEY = "test";
process.env.SUPABASE_URL = "https://example.invalid";
process.env.SUPABASE_ANON_KEY = "test";
const draft = { qualification: { title: "Management", saqaId: "12345", nqfLevel: 5, credits: 10, description: "Management qualification" }, modules: [{ name: "Team development", description: "Develop teams", outcomes: ["Support a team"], units: [{ us: "123", title: "Teamwork", nqf: 5, credits: 10, description: "Work with a team", outcomes: ["Contribute to a team"] }] }], issues: [] };
const zip = new JSZip(); zip.file("word/document.xml", "<w:document><w:p><w:t>Module 1: Team development</w:t></w:p><w:p><w:t>Unit 123 Teamwork</w:t></w:p></w:document>");
const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Module", "Unit"], ["Team development", "123"]]), "Mapping");
const documents = new Map<string, Blob>([
  ["outline.txt", new Blob(["Qualification 12345 Management, NQF 5, credits 10"])],
  ["module.docx", new Blob([await zip.generateAsync({ type: "uint8array" })])],
  ["mapping.xlsx", new Blob([XLSX.write(workbook, { type: "array", bookType: "xlsx" })])],
  ["unit.pdf", new Blob(["%PDF-test"], { type: "application/pdf" })],
  ["page.png", new Blob(["test-image"], { type: "image/png" })],
]);
const pack = { id: "pack-1", name: "Management pack", files: [...documents].map(([name, blob]) => ({ name, path: `tenant/${name}`, size: blob.size })) };
const original = globalThis.fetch;
let mode = "valid"; let aiCalls = 0; let cleaned = 0;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url.endsWith("/rpc/is_admin")) return Response.json(mode !== "forbidden");
  if (url.endsWith("/rpc/current_tenant")) return Response.json("tenant");
  if (url.includes("/shared_state?")) { assert.match(url, /tenant_id=eq.tenant/); return Response.json([{ value: JSON.stringify(mode === "missing" ? [] : [pack]) }]); }
  if (url.includes("/storage/")) { const name = decodeURIComponent(url.split("/").at(-1)!); return new Response(documents.get(name)!); }
  if (url.endsWith("/v1/files")) return Response.json({ id: "file-test" });
  if (url.endsWith("/v1/files/file-test")) { assert.equal(init?.method, "DELETE"); cleaned++; return Response.json({ deleted: true }); }
  if (url.endsWith("/chat/completions")) {
    aiCalls++;
    const body = JSON.parse(String(init?.body));
    assert.equal(body.response_format.json_schema.strict, true);
    const content = body.messages[1].content;
    assert.ok(content.some((item: { type: string }) => item.type === "file"));
    assert.ok(content.some((item: { type: string }) => item.type === "image_url"));
    assert.ok(content.some((item: { text?: string }) => item.text?.includes("Module 1: Team development")));
    assert.ok(content.some((item: { text?: string }) => item.text?.includes("Mapping")));
    const result = mode === "no-mapping" ? { ...draft, modules: [], issues: ["Module mapping absent"] } : draft;
    return Response.json({ choices: [{ message: { content: JSON.stringify(result) } }] });
  }
  throw new Error(`Unexpected request ${url}`);
};
const request = (signed = true) => new Request("https://example.invalid/api/qualification-pack", { method: "POST", headers: signed ? { Authorization: "Bearer test" } : {}, body: JSON.stringify({ packId: "pack-1" }) });
try {
  assert.equal((await handler(request(false))).status, 401);
  mode = "forbidden"; assert.equal((await handler(request())).status, 403);
  mode = "missing"; assert.match((await (await handler(request())).json()).error, /unavailable/); assert.equal(aiCalls, 0);
  mode = "valid";
  const result = await (await handler(request())).json(); assert.deepEqual(result.draft, draft); assert.equal(cleaned, 1);
  validateCourseDetails(packCourseDetails(readQualificationDraft(result.draft)));
  mode = "no-mapping"; assert.match((await (await handler(request())).json()).error, /Module mapping absent/); assert.equal(cleaned, 2);
  const missing = structuredClone(draft); (missing.qualification as unknown as { credits: null }).credits = null;
  assert.equal(readQualificationDraft(missing).qualification.credits, -1);
  assert.throws(() => validateCourseDetails(packCourseDetails(missing)), /credits/);
  console.log("Qualification pack tests passed: mixed documents, tenant/admin checks, mappings, cleanup and missing metadata.");
} finally { globalThis.fetch = original; }
