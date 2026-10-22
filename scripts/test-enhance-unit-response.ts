import handler, { readGeneratedObject } from "../api/enhance-unit-content";
import { buildUnitContent, mergeUnitContentEnhancement, validateUnitContent } from "../src/lib/unitBuilder";

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
  const documents = {
    logbook: {
      assignmentTitle: "Hardware inventory", programme: "IT System Support", unitLabel: "12345 - Test",
      detailFields: ["Learner name"],
      project: { time: "30 minutes", title: "Inventory", text: "Inspect a workstation and submit its verified hardware inventory.", resource: "Workstation" },
      knowledgeQuestions: [{ text: "Identify workstation components.", marks: [true, false, false, true, false, false] }],
      practicalActivities: [{ text: "Record installed components.", marks: [false, true, false, false, true, false] }],
      workplaceActivities: ["Check the inventory with a supervisor."], workplaceEvidenceNote: "Attach the signed inventory.",
      otherActivities: [{ activity: "Review the inventory.", evidence: "Supervisor confirmation." }],
      otherEvidenceNote: "Keep the review record.", projectChecklist: [{ no: "1", name: "Verified component inventory" }],
    },
    selfAssessment: { intro: ["Review your competence."], items: ["I can identify workstation components."], outro: ["Request support if needed."] },
    lessonPlan: {
      title: "Component identification", startTime: "09:00", details: [{ icon: "clock", label: "Duration", value: "60 minutes" }],
      prep: ["Prepare a workstation."], sections: [{
        heading: "Workstation components", startTime: "", rows: [
          { time: "10 minutes", title: "Welcome", break: false, text: [], bullets: ["Confirm outcomes."], resources: [] },
          { time: "40 minutes", title: "Components - Facilitator & Class", break: false, text: [], bullets: ["Demonstrate component identification."], resources: ["Workstation"] },
          { time: "10 minutes", title: "Closing", break: false, text: [], bullets: ["Review the inventory."], resources: [] },
        ],
      }],
    },
    workbook: { title: "Hardware workbook", outcomes: [{
      id: "so-1", specificOutcome: 1, title: "Identify components", learningOutcomes: ["Identify workstation hardware."],
      questions: [{ id: "task-1", task: 1, text: "Identify the main workstation components.", marks: 5 }],
    }] },
    sources: [{ title: "Test reference", url: "https://example.invalid/unit/12345" }],
  };
  const layout = [{ sectionIndex: 0, paragraphStart: 0, paragraphEnd: 1, paragraphFormats: ["paragraph"] }];
  type StrictSchema = { type: string; required?: string[]; additionalProperties?: boolean; properties?: Record<string, StrictSchema>; items?: StrictSchema };
  function assertStrictSchema(schema: StrictSchema) {
    if (schema.type === "object") {
      assert(schema.additionalProperties === false, "Every generated object must be closed, not free-form.");
      const keys = Object.keys(schema.properties ?? {});
      assert(keys.length > 0 && JSON.stringify([...(schema.required ?? [])].sort()) === JSON.stringify(keys.sort()), "Every generated field must be explicitly defined and required.");
      Object.values(schema.properties ?? {}).forEach(assertStrictSchema);
    }
    if (schema.items) assertStrictSchema(schema.items);
  }
  const scenarios: { content: unknown; expectedStatus: number; expectedError: string; layoutContent?: unknown }[] = [
    { content: complete(documents), expectedStatus: 200, expectedError: "" },
    { content: { status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, output_text: '{"logbook":' }, expectedStatus: 502, expectedError: "output limit" },
    { content: { status: "completed", output_text: '{"logbook":' }, expectedStatus: 502, expectedError: "malformed JSON" },
    { content: complete({ logbook: documents.logbook }), expectedStatus: 502, expectedError: "content.selfAssessment is missing" },
    { content: complete({ ...documents, logbook: {} }), expectedStatus: 502, expectedError: "content.logbook.assignmentTitle is missing" },
    { content: complete({ ...documents, selfAssessment: { ...documents.selfAssessment, items: "not a list" } }), expectedStatus: 502, expectedError: "content.selfAssessment.items must be a list" },
    { content: complete({ ...documents, logbook: { ...documents.logbook, knowledgeQuestions: [] } }), expectedStatus: 502, expectedError: "content.logbook.knowledgeQuestions has an invalid number of entries" },
    { content: complete({ ...documents, workbook: null }), expectedStatus: 502, expectedError: "content.workbook must be a document object" },
    { content: complete({ ...documents, logbook: { ...documents.logbook, knowledgeQuestions: [{ text: "A criterion", marks: [1, 0, 0, 1, 0, 0] }] } }), expectedStatus: 502, expectedError: ".marks[0] must be true or false" },
    { content: complete(documents), layoutContent: complete({ lessonLayout: [{ ...layout[0], paragraphEnd: "1" }] }), expectedStatus: 502, expectedError: "content.lessonLayout[0].paragraphEnd must contain a valid number" },
  ];
  const unit = { us: "12345", title: "Test", nqf: 5, credits: 5, dates: "", time: "" };
  const source = "# Workstation components\n\n" + "Identify components and record their purpose in the hardware inventory. ".repeat(4);
  const base = buildUnitContent(unit, source, { minutes: 60 });
  for (const { content, expectedStatus, expectedError, layoutContent } of scenarios) {
    let generationCalls = 0;
    globalThis.fetch = async (input, init) => {
      if (String(input).endsWith("/rpc/is_admin")) return Response.json(true);
      generationCalls++;
      const request = JSON.parse(String(init?.body));
      const isLayout = request.text.format.name === "lesson_slide_layout";
      assert(request.text.format.strict === true, "Generation must enforce the schema, not merely suggest it.");
      assertStrictSchema(request.text.format.schema);
      assert(request.text.format.schema.required.includes("lessonLayout") === isLayout, "Only the layout request should require slide layout.");
      if (!isLayout) for (const unused of ["evaluation", "exercises", "questionSessions", "quiz"]) {
        assert(!(unused in request.text.format.schema.properties), "Unused or deterministically empty fields must not be generated or required.");
      }
      return Response.json(isLayout ? layoutContent ?? complete({ lessonLayout: layout }) : content);
    };
    const response = await handler(new Request("https://example.invalid/api/enhance-unit-content", {
      method: "POST",
      headers: { Authorization: "Bearer test", "Content-Type": "application/json" },
      body: JSON.stringify({
        unit,
        source,
        lessonStructure: [{ heading: "Test", paragraphs: ["Keep this source text."] }],
      }),
    }));
    const result = await response.json();
    assert(response.status === expectedStatus, `Expected HTTP ${expectedStatus}, got ${response.status}.`);
    assert(generationCalls === 2, "Build must request layout and supporting documents once each.");
    if (expectedError) assert(result.error.includes(expectedError), `Expected ${expectedError}, got ${result.error}.`);
    else {
      assert(JSON.stringify(result.content.lessonLayout) === JSON.stringify(layout), "Final content must use the separate layout response.");
      assert(JSON.stringify(result.content.exercises) === "[]" && JSON.stringify(result.content.questionSessions) === "[]" && JSON.stringify(result.content.quiz) === "[]", "The server must set disabled activities locally, not depend on the model returning empty lists.");
      const enhanced = mergeUnitContentEnhancement(base, result.content, unit);
      validateUnitContent(enhanced);
      assert(enhanced.logbook?.project.text === documents.logbook.project.text, "A real generated logbook must survive the client merge.");
      assert(enhanced.selfAssessment?.items[0] === documents.selfAssessment.items[0], "A real generated checklist must survive the client merge.");
      assert(enhanced.workbook?.outcomes[0].questions[0].text === documents.workbook.outcomes[0].questions[0].text, "A real generated workbook must survive the client merge.");
      assert(enhanced.lessonPlan?.prep[0] === documents.lessonPlan.prep[0], "A real generated plan must survive the client merge.");
    }
  }
} finally {
  globalThis.fetch = originalFetch;
  keys.forEach((key, index) => {
    if (originalEnv[index] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[index];
  });
}
console.log("Passed strict AI generation and real document merge tests: complete content without unused fields, malformed/truncated/refused output, missing nested fields, invalid types, empty lists and separate slide layout.");
