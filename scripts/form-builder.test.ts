import assert from "node:assert/strict";
import { test } from "node:test";
import { parseFormDefinition, validateFormAnswers } from "../src/lib/formSchema";

const definition = {
  title: "Equipment request",
  description: "Request equipment for a practical session.",
  sections: [{
    id: "request",
    title: "Request details",
    description: "",
    fields: [
      { id: "name", label: "Full name", type: "text", required: true, helpText: "", options: [] },
      { id: "email", label: "Email", type: "email", required: false, helpText: "", options: [] },
      { id: "date", label: "Date needed", type: "date", required: false, helpText: "", options: [] },
      { id: "equipment", label: "Equipment", type: "select", required: true, helpText: "", options: ["Laptop", "Switch"] },
      { id: "consent", label: "I accept responsibility", type: "checkbox", required: true, helpText: "", options: [] },
    ],
  }],
};

test("generated forms preserve sections, labels and choice options", () => {
  assert.deepEqual(parseFormDefinition(definition), definition);
});

test("rejects invalid generated fields and duplicate identifiers", () => {
  const invalid = structuredClone(definition);
  invalid.sections[0].fields[1].id = "name";
  assert.throws(() => parseFormDefinition(invalid), /unique/);
  invalid.sections[0].fields[1].id = "email";
  invalid.sections[0].fields[3].options = [];
  assert.throws(() => parseFormDefinition(invalid), /Choice fields/);
  invalid.sections[0].fields[0].type = "html";
  assert.throws(() => parseFormDefinition(invalid), /Invalid field type/);
});

test("validates required fields, choices, email and calendar dates", () => {
  const parsed = parseFormDefinition(definition);
  assert.deepEqual(Object.keys(validateFormAnswers(parsed, {})), ["name", "equipment", "consent"]);
  assert.deepEqual(validateFormAnswers(parsed, { name: "Learner", equipment: "Laptop", consent: true }), {});
  const invalid = validateFormAnswers(parsed, { name: "Learner", equipment: "Printer", consent: true, email: "wrong", date: "2026-02-30" });
  assert.deepEqual(Object.keys(invalid), ["email", "date", "equipment"]);
});