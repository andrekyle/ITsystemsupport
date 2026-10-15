import handler, { readGeneratedObject } from "../api/enhance-unit-content";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const complete = (value: unknown) => ({
  status: "completed",
  output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(value) }] }],
});

for (const [data, expected] of [
  [{ status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, output_text: '{"logbook":' }, "output limit"],
  [{ status: "incomplete" }, "stopped before finishing"],
  [{ status: "failed" }, "could not complete"],
  [{ output: [{ content: [{ type: "refusal" }] }] }, "declined"],
  [{ output_text: '{"logbook":' }, "malformed JSON"],
  [{ output_text: "" }, "no document content"],
  [complete([]), "invalid document object"],
  [complete(null), "invalid document object"],
  [complete({}), "invalid document object"],
  [null, "unreadable response"],
] as const) {
  const result = readGeneratedObject(data, "Test model");
  assert("error" in result && result.error.includes(expected), `Expected explicit ${expected} error.`);
}
assert("content" in readGeneratedObject(complete({ title: "Complete" }), "Test model"), "Complete provider output should parse.");
assert("content" in readGeneratedObject({ output_text: '{"title":"Complete"}' }, "Test model"), "Top-level output text should parse.");

const originalFetch = globalThis.fetch;
const keys = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "OPENAI_API_KEY", "OPENAI_UNIT_MODEL"];
const originalEnv = keys.map(key => process.env[key]);
try {
  process.env.SUPABASE_URL = "https://example.invalid";
  process.env.SUPABASE_ANON_KEY = "test";
  process.env.OPENAI_API_KEY = "test";
  process.env.OPENAI_UNIT_MODEL = "gpt-4.1-mini";
  const documents = { logbook: {}, evaluation: {}, selfAssessment: {}, lessonPlan: {}, workbook: {}, exercises: [], questionSessions: [], quiz: [], sources: [] };
  const layout = [{ sectionIndex: 0, paragraphStart: 0, paragraphEnd: 1, paragraphFormats: ["paragraph"] }];
  for (const [content, expectedStatus, expectedError] of [
    [complete(documents), 200, ""],
    [{ status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, output_text: '{"logbook":' }, 502, "output limit"],
    [{ status: "completed", output_text: '{"logbook":' }, 502, "malformed JSON"],
    [complete({ logbook: {} }), 502, "omitted required"],
  ] as const) {
    let generationCalls = 0;
    globalThis.fetch = async (input, init) => {
      if (String(input).endsWith("/rpc/is_admin")) return Response.json(true);
      generationCalls++;
      const request = JSON.parse(String(init?.body));
      const isLayout = request.text.format.name === "lesson_slide_layout";
      assert(request.text.format.schema.required.includes("lessonLayout") === isLayout, "Only the layout request should require slide layout.");
      return Response.json(isLayout ? complete({ lessonLayout: layout }) : content);
    };
    const response = await handler(new Request("https://example.invalid/api/enhance-unit-content", {
      method: "POST",
      headers: { Authorization: "Bearer test", "Content-Type": "application/json" },
      body: JSON.stringify({
        unit: { us: "12345", title: "Test" },
        source: "Reference material. ".repeat(10),
        lessonStructure: [{ heading: "Test", paragraphs: ["Keep this source text."] }],
      }),
    }));
    const result = await response.json();
    assert(response.status === expectedStatus, `Expected HTTP ${expectedStatus}, got ${response.status}.`);
    assert(generationCalls === 2, "Build must request layout and supporting documents once each.");
    if (expectedError) assert(result.error.includes(expectedError), `Expected ${expectedError}, got ${result.error}.`);
    else assert(JSON.stringify(result.content.lessonLayout) === JSON.stringify(layout), "Final content must use the separate layout response.");
  }
} finally {
  globalThis.fetch = originalFetch;
  keys.forEach((key, index) => {
    if (originalEnv[index] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[index];
  });
}
console.log("Passed AI response parsing and Build endpoint tests: complete, truncated, malformed, refused, empty and missing documents; separate layout ownership.");
