import assert from "node:assert/strict";
import handler from "../api/qualification-pack";
import { packCourseDetails, readQualificationDraft } from "../src/lib/qualificationPack";
import { validateCourseDetails } from "../src/lib/courseMetadata";

process.env.OPENAI_API_KEY = "test";
process.env.SUPABASE_URL = "https://example.invalid";
process.env.SUPABASE_ANON_KEY = "test";
const draft = { qualification: { title: "Management", saqaId: "12345", nqfLevel: 5, credits: 10, description: "Management qualification" }, modules: [{ name: "Team development", description: "Develop teams", outcomes: ["Support a team"], units: [{ us: "123", title: "Teamwork", nqf: 5, credits: 10, description: "Work with a team", outcomes: ["Contribute to a team"] }] }], issues: [] };
// A large pack must use folder metadata only, regardless of document size/type.
const pack = { id: "pack-1", name: "12345 Management Level 5", files: Array.from({ length: 240 }, (_, i) => ({ name: `resource-${i}.doc`, relativePath: `Management/Module 1 Team development/123 Teamwork/resource-${i}.doc`, path: `tenant/resource-${i}.doc`, size: 10 * 1024 * 1024 })) };
const original = globalThis.fetch;
let mode = "valid"; let aiCalls = 0;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url.endsWith("/rpc/is_admin")) return Response.json(mode !== "forbidden");
  if (url.endsWith("/rpc/current_tenant")) return Response.json("tenant");
  if (url.includes("/shared_state?")) { assert.match(url, /tenant_id=eq.tenant/); return Response.json([{ value: JSON.stringify(mode === "missing" ? [] : [pack]) }]); }
  if (url.endsWith("/chat/completions")) {
    aiCalls++;
    const body = JSON.parse(String(init?.body));
    assert.equal(body.response_format.json_schema.strict, true);
    const content = body.messages[1].content;
    assert.equal(content.length, 1);
    assert.match(content[0].text, /Management\/Module 1 Team development\/123 Teamwork/);
    assert.equal(content[0].text.split("Module 1 Team development").length - 1, 1, "Repeated folders are deduplicated");
    assert.ok(!content[0].text.includes("resource-"), "Document names are excluded");
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
  const result = await (await handler(request())).json(); assert.deepEqual(result.draft.modules, draft.modules); assert.match(result.draft.issues[0], /folder names only/);
  validateCourseDetails(packCourseDetails(readQualificationDraft(result.draft)));
  mode = "no-mapping"; assert.match((await (await handler(request())).json()).error, /Module mapping absent/);
  pack.files.forEach(file => { file.relativePath = file.name; });
  const before = aiCalls;
  mode = "valid"; assert.match((await (await handler(request())).json()).error, /no saved folder structure/); assert.equal(aiCalls, before);
  const missing = structuredClone(draft); (missing.qualification as unknown as { credits: null }).credits = null;
  assert.equal(readQualificationDraft(missing).qualification.credits, -1);
  assert.throws(() => validateCourseDetails(packCourseDetails(missing)), /credits/);
  console.log("Qualification pack tests passed: 240 large files without document downloads, deduplicated folders, tenant/admin checks, missing folder structure and metadata.");
} finally { globalThis.fetch = original; }
