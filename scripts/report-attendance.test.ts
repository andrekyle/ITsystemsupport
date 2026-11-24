import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildLearnerAttendanceRecords,
  deterministicAttendanceAnswer,
} from "../src/lib/reportAttendance";
import {
  attendanceSignerCount,
  isCountedAttendanceRegister,
  MIN_ATTENDANCE_REGISTER_LEARNERS,
} from "../src/lib/attendanceEvidence";
import reportHandler, { unregisteredAttendanceDates } from "../api/generate-report";
import {
  containsProtectedLearnerInfoRequest,
  PRIVATE_LEARNER_INFO_REFUSAL,
  sanitizeAssistantData,
} from "../src/lib/assistantPrivacy";

const dates = [
  "2026-10-01",
  "2026-10-08",
  "2026-10-15",
  "2026-10-22",
  "2026-10-29",
];

test("a register counts only with at least four distinct learners", () => {
  const rows = Object.fromEntries(
    Array.from({ length: MIN_ATTENDANCE_REGISTER_LEARNERS }, (_, index) => [
      `learner-${index + 1}`,
      { idNumber: `ID-${index + 1}`, name: `Learner ${index + 1}`, surname: "Test" },
    ])
  );
  const belowThreshold = Object.fromEntries(Object.entries(rows).slice(0, 3));
  assert.equal(attendanceSignerCount(belowThreshold), 3);
  assert.equal(isCountedAttendanceRegister(belowThreshold), false);
  assert.equal(attendanceSignerCount(rows), 4);
  assert.equal(isCountedAttendanceRegister(rows), true);

  const duplicateLearner = { ...rows, "duplicate-profile": rows["learner-1"] };
  assert.equal(attendanceSignerCount(duplicateLearner), 4);
});

test("attendance records count absences from register statuses, not total sessions", () => {
  const [record] = buildLearnerAttendanceRecords(
    [{ id: "eesa", name: "Eesa Marshman", signedDates: ["2026-09-24", "2026-10-22"] }],
    dates.map((date) => ({
      date,
      signedProfileIds: date === "2026-10-22" ? ["eesa"] : [],
    }))
  );

  assert.equal(record.absences, 4);
  assert.equal(record.sessionsExpected, 5);
  assert.deepEqual(record.sessions.map(({ date, status }) => [date, status]), [
    ["2026-10-01", "Absent"],
    ["2026-10-08", "Absent"],
    ["2026-10-15", "Absent"],
    ["2026-10-22", "Present"],
    ["2026-10-29", "Absent"],
  ]);
});

test("qualifying register signatures override a later enrolment-form date", () => {
  const [thokozani, bradley] = buildLearnerAttendanceRecords(
    [
      {
        id: "thokozani",
        name: "Thokozani",
        enrolmentSignedDate: "2026-08-13",
        signedDates: ["2026-07-17", "2026-07-24"],
      },
      {
        id: "bradley",
        name: "Bradley",
        enrolmentSignedDate: "2026-08-13",
        signedDates: ["2026-08-05", "2026-08-21"],
      },
    ],
    [
      { date: "2026-07-17", signedProfileIds: ["thokozani"] },
      { date: "2026-07-24", signedProfileIds: ["thokozani"] },
      { date: "2026-08-05", signedProfileIds: ["bradley"] },
      { date: "2026-08-07", signedProfileIds: [] },
      { date: "2026-08-14", signedProfileIds: [] },
      { date: "2026-08-21", signedProfileIds: ["bradley"] },
    ]
  );

  assert.equal(thokozani.firstSession, "2026-07-17");
  assert.deepEqual(thokozani.sessions.map(({ date, status }) => [date, status]), [
    ["2026-07-17", "Present"],
    ["2026-07-24", "Present"],
    ["2026-08-05", "Absent"],
    ["2026-08-07", "Absent"],
    ["2026-08-14", "Absent"],
    ["2026-08-21", "Absent"],
  ]);
  assert.equal(bradley.firstSession, "2026-08-05");
  assert.deepEqual(bradley.sessions.map(({ date, status }) => [date, status]), [
    ["2026-08-05", "Present"],
    ["2026-08-07", "Absent"],
    ["2026-08-14", "Absent"],
    ["2026-08-21", "Present"],
  ]);
});

test("attendance follow-up tables use the same exact records as the count", () => {
  const [record] = buildLearnerAttendanceRecords(
    [{ id: "eesa", name: "Eesa Marshman", signedDates: ["2026-09-24", "2026-10-22"] }],
    dates.map((date) => ({
      date,
      signedProfileIds: date === "2026-10-22" ? ["eesa"] : [],
    }))
  );
  const answer = deterministicAttendanceAnswer(
    "show me",
    [{ role: "assistant", content: "Eesa Marshman was absent for 5 sessions." }],
    [record]
  );

  assert.ok(answer);
  assert.match(answer, /absent for 4 of 5 expected sessions/);
  assert.match(answer, /\| 2026-10-22 \| Present \|/);
  assert.equal((answer.match(/\| Absent \|/g) ?? []).length, 4);
  assert.equal(
    deterministicAttendanceAnswer("How many sessions was Eesa absent?", [], [record]),
    "Eesa Marshman was absent for 4 of 5 expected sessions."
  );
  assert.equal(
    deterministicAttendanceAnswer("How many sessions did Eesa attend?", [], [record]),
    "Eesa Marshman attended 1 of 5 expected sessions."
  );
  assert.equal(
    deterministicAttendanceAnswer("Was Eesa present on 2026-10-22?", [], [record]),
    "On 2026-10-22, Eesa Marshman was marked present."
  );
  assert.equal(
    deterministicAttendanceAnswer("How many sessions was Eesa absent last month?", [], [record]),
    null
  );
});

test("date tables contain filled register dates only", () => {
  const [record] = buildLearnerAttendanceRecords(
    [{ id: "eesa", name: "Eesa Marshman", signedDates: ["2026-11-20"] }],
    [{ date: "2026-11-20", signedProfileIds: ["eesa"] }]
  );
  const answer = deterministicAttendanceAnswer("Show me Eesa's register days", [], [record]);

  assert.ok(answer);
  assert.match(answer, /\| 2026-11-20 \| Present \|/);
  assert.doesNotMatch(answer, /2026-11-21|2026-11-27/);
});

test("late joiners are measured only from their first signed session", () => {
  const [record] = buildLearnerAttendanceRecords(
    [{ id: "learner", name: "Learner One", signedDates: ["2026-10-15"] }],
    dates.map((date) => ({
      date,
      signedProfileIds: date === "2026-10-15" ? ["learner"] : [],
    }))
  );

  assert.equal(record.sessionsExpected, 3);
  assert.equal(record.sessionsAttended, 1);
  assert.equal(record.absences, 2);
});

test("the answer API returns exact attendance counts without an AI round trip", async () => {
  const [record] = buildLearnerAttendanceRecords(
    [{ id: "eesa", name: "Eesa Marshman", signedDates: ["2026-09-24", "2026-10-22"] }],
    dates.map((date) => ({
      date,
      signedProfileIds: date === "2026-10-22" ? ["eesa"] : [],
    }))
  );
  const response = await reportHandler(new Request("https://example.test/api/generate-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "custom",
      mode: "answer",
      question: "How many sessions was Eesa absent?",
      data: { attendanceRecords: [record] },
    }),
  }));
  const result = await response.json() as { error?: string; answer?: string };

  assert.equal(result.error, "direct");
  assert.equal(result.answer, "Eesa Marshman was absent for 4 of 5 expected sessions.");
});

test("attendance answers reject timetable dates without a filled register", () => {
  const data = {
    registeredAttendanceDates: ["2026-11-20"],
  };
  assert.deepEqual(
    unregisteredAttendanceDates(
      "| 2026-11-20 | Present |\n| 2026-11-21 | Absent |\n| 27 November 2026 | Absent |",
      data
    ),
    ["2026-11-21", "27 November 2026"]
  );
});

test("private learner details are refused and stripped from AI data", async () => {
  const response = await reportHandler(new Request("https://example.test/api/generate-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "custom",
      mode: "answer",
      question: "What is Eesa's ID number?",
      data: { learners: [{ name: "Eesa Marshman", idNumber: "0000000000000" }] },
    }),
  }));
  const result = await response.json() as { error?: string; answer?: string };
  const safeData = sanitizeAssistantData({
    id: "0000000000000",
    emailAddress: "learner@example.com",
    phoneNumber: "000 000 0000",
    notes: "ID 0000000000000; contact learner@example.com at 000 000 0000",
    learner: { name: "Eesa Marshman", idNumber: "0000000000000", completionPct: 80 },
  }) as Record<string, unknown>;

  assert.equal(containsProtectedLearnerInfoRequest("What is Eesa's ID number?"), true);
  assert.equal(containsProtectedLearnerInfoRequest("Give me Eesa's phone number."), true);
  assert.equal(containsProtectedLearnerInfoRequest("What is Eesa's email address?"), true);
  assert.equal(containsProtectedLearnerInfoRequest("How was Eesa's attendance?"), false);
  assert.equal(result.error, "direct");
  assert.equal(result.answer, PRIVATE_LEARNER_INFO_REFUSAL);
  assert.deepEqual(safeData.learner, { name: "Eesa Marshman", completionPct: 80 });
  assert.doesNotMatch(JSON.stringify(safeData), /0000000000000|learner@example\.com|000 000 0000/);
});
