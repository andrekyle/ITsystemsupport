import assert from "node:assert/strict";
import { test } from "node:test";
import handler from "../api/generate-form";

const validDefinition = {
  title: "Equipment request",
  description: "",
  sections: [{ id: "details", title: "Details", description: "", fields: [
    { id: "name", label: "Full name", type: "text", required: false, helpText: "", options: [] },
  ] }],
};

async function runRequest(admin: boolean, content: unknown, input: unknown = { name: "request.pdf", text: "Full name: ______", images: [] }) {
  const originalFetch = globalThis.fetch;
  const envKeys = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "OPENAI_API_KEY"];
  const originalEnv = envKeys.map(key => process.env[key]);
  process.env.SUPABASE_URL = "https://form-builder.invalid";
  process.env.SUPABASE_ANON_KEY = "test-anon-key";
  process.env.OPENAI_API_KEY = "test-key";
  let generationCalls = 0;
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith("/auth/v1/user")) return Response.json({ id: "test-user" });
    if (String(url).endsWith("/rpc/is_admin")) return Response.json(admin);
    assert.equal(String(url), "https://api.openai.com/v1/chat/completions");
    generationCalls += 1;
    const payload = JSON.parse(String(options?.body));
    assert.equal(payload.response_format.json_schema.strict, true);
    assert.match(payload.messages[0].content, /untrusted source data/);
    return Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }] });
  };
  try {
    const response = await handler(new Request("https://example.invalid/api/generate-form", {
      method: "POST", headers: { Authorization: "Bearer test-session", "Content-Type": "application/json" }, body: JSON.stringify(input),
    }));
    return { status: response.status, body: await response.json(), generationCalls };
  } finally {
    globalThis.fetch = originalFetch;
    envKeys.forEach((key, index) => {
      if (originalEnv[index] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[index];
    });
  }
}

test("requires a session before generation", async () => {
  const response = await handler(new Request("https://example.invalid/api/generate-form", { method: "POST" }));
  assert.equal(response.status, 401);
});

test("non-admin cannot call the model", async () => {
  const result = await runRequest(false, validDefinition);
  assert.equal(result.status, 403);
  assert.equal(result.generationCalls, 0);
});

test("returns a validated definition to an administrator", async () => {
  const result = await runRequest(true, validDefinition);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.definition, validDefinition);
});

test("rejects remote image URLs and malformed generated output", async () => {
  const remote = await runRequest(true, validDefinition, { images: ["https://example.invalid/private"] });
  assert.equal(remote.status, 400);
  assert.equal(remote.generationCalls, 0);
  const malformed = await runRequest(true, { title: "Not a form", sections: [] });
  assert.equal(malformed.status, 422);
});