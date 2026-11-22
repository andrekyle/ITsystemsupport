import assert from "node:assert/strict";
import handler from "../api/cover-image";

process.env.OPENAI_API_KEY = "test-only";
process.env.SUPABASE_URL = "https://example.invalid";
process.env.SUPABASE_ANON_KEY = "test-only";
process.env.OPENAI_IMAGE_MODEL = "gpt-image-2";
let allowed = true;
let mode = "ok";
let calls = 0;
const original = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  if (String(input).includes("is_admin")) return Response.json(allowed);
  assert.equal(String(input), "https://api.openai.com/v1/images/generations");
  calls++;
  const body = JSON.parse(String(init?.body));
  assert.equal(body.size, "1536x512");
  assert.equal(body.output_format, "jpeg");
  assert.equal(body.n, 1);
  assert.match(body.prompt, /charcoal-black/);
  assert.match(body.prompt, /Network support/);
  if (mode === "failure") return new Response("Unavailable", { status: 429 });
  if (mode === "slow") await new Promise(resolve => setTimeout(resolve, 50));
  return Response.json({ data: [{ b64_json: mode === "invalid" ? "not an image!" : "/9j/2Q==" }] });
};
const input = { kind: "module", title: "Network support", label: "MODULE 2", courseTitle: "IT systems" };
const request = (body: unknown = input, signed = true) => new Request("https://example.invalid/api/cover-image", { method: "POST", headers: signed ? { Authorization: "Bearer test" } : {}, body: JSON.stringify(body) });
try {
  assert.equal((await handler(request(input, false))).status, 401);
  allowed = false;
  assert.equal((await handler(request())).status, 403);
  allowed = true;
  for (const body of [null, {}, { ...input, kind: "other" }, { ...input, title: "" }, { ...input, title: "x".repeat(501) }]) assert.equal((await handler(request(body))).status, 400);
  assert.equal(calls, 0);
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).image, "data:image/jpeg;base64,/9j/2Q==");
  for (mode of ["failure", "invalid"]) {
    const failed = await handler(request());
    assert.equal(failed.status, 200, "The stream status is sent before image generation completes");
    const result = await failed.json();
    assert.equal(typeof result.error, "string");
  }
  mode = "slow";
  const delayed = await handler(request());
  const reader = delayed.body!.getReader();
  const decoder = new TextDecoder();
  const first = await reader.read();
  assert.equal(decoder.decode(first.value), " ", "The response starts before the image request completes");
  let rest = "";
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    rest += decoder.decode(chunk.value);
  }
  assert.equal(JSON.parse(rest).image, "data:image/jpeg;base64,/9j/2Q==");
  console.log("Cover image API tests passed.");
} finally { globalThis.fetch = original; }
