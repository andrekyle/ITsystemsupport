import assert from "node:assert/strict";
import { test } from "node:test";
import type { LearnerRow } from "../src/pages/Analytics";
import { programmeAnalysisData, programmeAnalysisHtml, PROGRAMME_ANALYSIS_CSS } from "../src/lib/programmeAnalysis";
import reportHandler from "../api/generate-report";

const learner = (id: string, overrides: Partial<LearnerRow> = {}): LearnerRow => ({
  profile: { id, name: id, role: "Learner", createdAt: "2026-01-01" },
  completion: 0, unitsCompleted: 0, creditsEarned: 0,
  quizAvg: null, quizzesTaken: 0, exerciseAvg: null, poeDone: 0,
  attendance: 0, attendanceExpected: 0, attendanceRate: null,
  lastLogin: undefined, daysSinceSeen: null, xp: 0, level: 1, levelName: "Beginner",
  atRisk: false, riskReasons: [], unitStatus: {}, signedDates: [],
  ...overrides,
});
const units = [{ us: "101", title: "Unit one", module: "Module one" }, { us: "102", title: "Unit two", module: "Module one" }];
const outcomes = [{ unitStandard: "US 101", competent: 1, notYetCompetent: 1, noDecisionYet: 0 }];
const rows = [
  learner("A", { completion: 0.25, attendanceRate: 1, quizAvg: 0.8, exerciseAvg: 0.6, poeDone: 5, creditsEarned: 10, daysSinceSeen: 15, atRisk: true, unitStatus: { "101": "C", "102": "SA" }, signedDates: ["2026-10-01", "2026-10-01", "2026-10-02"] }),
  learner("B", { completion: 1, unitStatus: { "101": "IP" }, signedDates: ["2026-10-02"] }),
];
const build = (cohort = rows) => programmeAnalysisData(cohort, units, outcomes, 10, 148);

test("thirteen graphs use exact recorded values and distinguish missing results", () => {
  const data = build();
  assert.equal(data.charts.length, 10);
  assert.deepEqual(data.charts[0].points.map(point => point.value), [25, 100]);
  assert.deepEqual(data.charts[1].points.map(point => point.value), [0, 1, 0, 0, 1]);
  assert.deepEqual(data.charts[2].points.map(point => point.value), [100, null]);
  assert.deepEqual(data.charts[3].points.map(point => point.value), [80, null]);
  assert.deepEqual(data.charts[4].points.map(point => point.value), [60, null]);
  assert.deepEqual(data.charts[5].points.map(point => point.value), [50, 0]);
  assert.deepEqual(data.charts[6].points.map(point => point.value), [10, 0]);
  assert.equal(data.charts[7].points[0].value, 25);
  assert.equal(data.atRisk, 1);
  assert.equal((programmeAnalysisHtml(data).match(/<figure /g) ?? []).length, 13);
});

test("status counts and session signatures count each learner once", () => {
  const data = build();
  assert.deepEqual(data.status[0].values, [1, 0, 1, 0]);
  assert.deepEqual(data.status[1].values, [0, 1, 0, 1]);
  assert.deepEqual(data.sessions, [{ label: "2026-10-01", value: 1 }, { label: "2026-10-02", value: 2 }]);
  assert.deepEqual(data.scatter, [{ label: "A", attendance: 100, completion: 25 }]);
});

test("empty and unstarted scopes do not invent modules or decisions", () => {
  const data = programmeAnalysisData([], [], [], 0, 0);
  const html = programmeAnalysisHtml(data);
  assert.equal(data.status.length, 0);
  assert.equal(data.charts[7].points.length, 0);
  assert.match(html, /No learners recorded/);
  assert.match(html, /No session signatures recorded/);
  assert.match(html, /No paired attendance/);
  assert.doesNotMatch(html, /NaN|Infinity/);
  assert.deepEqual(data.charts[9].points.map(point => point.value), [0, 0, 0]);
});

test("chart labels are escaped and the report retains the requested palette and print styling", () => {
  const html = programmeAnalysisHtml(build([learner('<script>"&')]));
  assert.match(html, /&lt;script&gt;&quot;&amp;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Not recorded/);
  assert.match(PROGRAMME_ANALYSIS_CSS, /border-radius:0/);
  assert.match(PROGRAMME_ANALYSIS_CSS, /background:var\(--series\)/);
  assert.match(PROGRAMME_ANALYSIS_CSS, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(PROGRAMME_ANALYSIS_CSS, /#f2c811/);
  assert.match(html, /Measure definition/);
  assert.doesNotMatch(PROGRAMME_ANALYSIS_CSS, /4n\+/);
  for (const colour of ["#00a4ef", "#7fba00", "#ffb900", "#f25022"]) {
    assert.ok(PROGRAMME_ANALYSIS_CSS.includes(colour));
  }
  assert.match(html, /background:#7fba00/);
  assert.match(html, /background:#00a4ef/);
  assert.match(html, /background:#ffb900/);
  assert.match(PROGRAMME_ANALYSIS_CSS, /@media print/);
  assert.match(html, /View chart data/);
});

test("the report API requests analysis narrative, not the management deck, and preserves existing tracker output", async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-only-mocked";
  const prompts: string[] = [];
  globalThis.fetch = async (_input, init) => {
    const request = JSON.parse(String(init?.body));
    prompts.push(request.messages[0].content);
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        intro: "Recorded cohort analysis.",
        sections: [{ heading: "Recorded completion", paragraphs: ["Two learners are recorded."] }],
        recommendations: ["Review missing assessment records."],
      }) } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    for (const kind of ["data-analysis", "tracker"]) {
      const response = await reportHandler(new Request("http://localhost/api/generate-report", {
        method: "POST",
        body: JSON.stringify({ kind, mode: "report", data: { learners: [{ name: "A" }], analysis: build() } }),
      }));
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.sections.length, 1);
      assert.equal(body.slides, undefined);
    }
    assert.match(prompts[0], /thirteen deterministic charts/);
    assert.match(prompts[0], /Null means not recorded/);
    assert.match(prompts[1], /ONE section PER LEARNER/);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});
