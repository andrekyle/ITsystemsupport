import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clientLearnerAttendanceStartDate,
  clientLearnerEnrolledForRegister,
  clientLearnerSigned,
} from "../src/lib/clientPortalAttendance";
import type { ClientAttendanceRegister, ClientLearner } from "../src/lib/clientPortal";

const thokozani: ClientLearner = {
  learner_ref: "thokozani",
  name: "Thokozani Junior Buthelezi",
  programme: "IT Systems Support",
  status: "Enrolled",
  start_date: "2026-08-13",
  end_date: null,
};

const bradley: ClientLearner = {
  learner_ref: "bradley",
  name: "Bradley Akhona Ncube",
  programme: "IT Systems Support",
  status: "Enrolled",
  start_date: "2026-07-17",
  end_date: null,
};

function register(date: string, rows: ClientAttendanceRegister["rows"]): ClientAttendanceRegister {
  return { date, signer_count: 11, rows };
}

test("dashboard uses register evidence for each learner's start and hides pre-start learners", () => {
  const july17 = register("2026-07-17", { thokozani: { name: thokozani.name } });
  const july24 = register("2026-07-24", { thokozani: { name: thokozani.name } });
  const august5 = register("2026-08-05", { bradley: { name: bradley.name } });
  const attendance = [july17, july24, august5];

  const thokozaniStart = clientLearnerAttendanceStartDate(thokozani, attendance);
  const bradleyStart = clientLearnerAttendanceStartDate(bradley, attendance);
  assert.equal(thokozaniStart, "2026-07-17");
  assert.equal(bradleyStart, "2026-08-05");
  assert.equal(clientLearnerSigned(july24, thokozani), true);
  assert.equal(clientLearnerEnrolledForRegister("2026-07-24", bradley, bradleyStart), false);
  assert.equal(clientLearnerEnrolledForRegister("2026-08-05", bradley, bradleyStart), true);
});
