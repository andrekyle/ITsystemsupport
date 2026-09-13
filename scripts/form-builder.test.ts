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

test("replica saved fields recover their printed comb and exact bounds", () => {
  const printed = { x: 0.2, y: 0.3, w: 0.6, h: 0.02 };
  const parsed = parseFormDefinition({
    title: "Saved replica",
    sections: [{ id: "details", fields: [{
      id: "surname", label: "Surname", type: "text", options: [],
      placement: { page: 1, box: { x: 0.198, y: 0.301, w: 0.601, h: 0.018 }, options: [] },
    }] }],
    pages: [{
      src: "https://example.test/form.png", width: 1000, height: 1400,
      layer: {
        text: [{ t: "Surname", x: 0.05, y: 0.3, w: 0.1, h: 0.02, s: 0.014, f: "arial", c: "#000000" }],
        combs: [{ ...printed, n: 20, c: "#000000", t: 0.001 }],
      },
    }],
  });
  const field = parsed.sections[0].fields[0];
  assert.equal(field.placement?.comb, 20);
  assert.deepEqual(field.placement?.box, printed);
  assert.deepEqual(parseFormDefinition(JSON.parse(JSON.stringify(parsed))), parsed);
});

test("replica comb recovery keeps unrelated fields and explicit placements intact", () => {
  const printed = { x: 0.2, y: 0.3, w: 0.6, h: 0.02 };
  const rawFields = [
    { id: "address", type: "textarea", box: printed },
    { id: "email", type: "email", box: printed },
    { id: "telephone", type: "tel", box: printed },
    { id: "quantity", type: "number", box: printed },
    { id: "nearby", type: "text", box: { ...printed, y: 0.325 } },
    { id: "multiple_rows", type: "textarea", box: { ...printed, h: 0.08 } },
    { id: "small_field", type: "text", box: { ...printed, w: 0.04 } },
    { id: "date", type: "date", box: printed },
    { id: "signature", type: "signature", box: printed },
    { id: "explicit", type: "text", box: { ...printed, x: 0.202 }, comb: 12 },
  ];
  const parsed = parseFormDefinition({
    sections: [{ id: "details", fields: rawFields.map(field => ({
      id: field.id, label: field.id, type: field.type, options: [], maxLength: 10,
      placement: { page: 1, box: field.box, options: [], comb: field.comb },
    })) }],
    pages: [{
      src: "https://example.test/form.png", width: 1000, height: 1400,
      layer: { combs: [{ ...printed, n: 20, c: "#000000", t: 0.001 }] },
    }],
  });
  assert.equal(parsed.pages[0].layer?.combs.length, 1);
  assert.equal(parsed.display, "digital");
  for (const field of parsed.sections[0].fields.slice(0, 4)) {
    assert.equal(field.placement?.comb, 20);
    assert.deepEqual(field.placement?.box, printed);
    assert.equal(field.maxLength, 10);
  }
  for (const field of parsed.sections[0].fields.slice(4, 9)) assert.equal(field.placement?.comb, undefined);
  assert.equal(parsed.sections[0].fields[9].placement?.comb, 12);
  assert.deepEqual(parsed.sections[0].fields[9].placement?.box, rawFields[9].box);
});