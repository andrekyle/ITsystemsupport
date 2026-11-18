import assert from "node:assert/strict";
import handler from "../api/course-metadata";

process.env.OPENAI_API_KEY = "test-only";
process.env.SUPABASE_URL = "https://example.invalid";
process.env.SUPABASE_ANON_KEY = "test-only";
const details = { title: "Test course", saqaId: "12345", nqfLevel: 4, credits: 10, description: "Course summary", unitCounts: [2, 1] };
const modules = details.unitCounts.map((count, index) => ({ name: `Module ${index + 1}`, description: "Summary", outcomes: ["Apply knowledge"], units: Array.from({ length: count }, (_, i) => ({ us: `${index + 1}${i + 1}`, title: `Unit ${index + 1}.${i + 1}`, nqf: 4, credits: 3, description: "Unit summary", outcomes: ["Demonstrate competence"] })) }));
const originalFetch = globalThis.fetch;
let mode = "valid";
let aiCalls = 0;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url.includes("/rpc/is_admin")) return Response.json(mode !== "forbidden");
  if (url.includes("showQualification")) return new Response(`Qualification 12345; unit standards 11 12 21. ${"Source record metadata. ".repeat(20)}`);
  if (url.includes("api.openai.com")) {
    aiCalls++;
    const request = JSON.parse(String(init?.body));
    assert.equal(request.response_format.json_schema.strict, true);
    const result = structuredClone(modules);
    if (mode === "duplicate") result[1].units[0].us = "11";
    if (mode === "unlisted") result[1].units[0].us = "99999";
    if (mode === "wrong-count") result.pop();
    return Response.json({ choices: [{ message: { content: JSON.stringify({ modules: result }) } }] });
  }
  throw new Error(`Unexpected fetch: ${url}`);
};
const request = (body: unknown = details, token = true) => new Request("https://example.invalid/api/course-metadata", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer test" } : {}) }, body: JSON.stringify(body) });
try {
  assert.equal((await handler(request(details, false))).status, 401);
  mode = "forbidden";
  assert.equal((await handler(request())).status, 403);
  mode = "valid";
  for (const unitCounts of [[], [0], [1.5], [31], Array(20).fill(6)]) assert.equal((await handler(request({ ...details, unitCounts }))).status, 400);
  assert.equal(aiCalls, 0, "Invalid and unauthorised requests must not call AI");
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).modules, modules);
  for (mode of ["duplicate", "unlisted", "wrong-count"]) assert.equal((await handler(request())).status, 502, mode);
  console.log("Course metadata API tests passed.");
} finally { globalThis.fetch = originalFetch; }
