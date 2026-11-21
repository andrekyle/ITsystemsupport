import assert from "node:assert/strict";
import test from "node:test";
import { cohortIds } from "../src/lib/cohorts";
import type { Profile } from "../src/types";

test("cohortIds returns distinct, trimmed learner cohorts only", () => {
  const profiles: Profile[] = [
    { id: "1", name: "One", role: "Learner", createdAt: "", cohortId: " Intake B " },
    { id: "2", name: "Two", role: "Learner", createdAt: "", cohortId: "Intake A" },
    { id: "3", name: "Three", role: "Learner", createdAt: "", cohortId: "Intake B" },
    { id: "4", name: "Staff", role: "Facilitator", createdAt: "", cohortId: "Staff group" },
    { id: "5", name: "Unassigned", role: "Learner", createdAt: "", cohortId: "  " },
  ];

  assert.deepEqual(cohortIds(profiles), ["Intake A", "Intake B"]);
});
