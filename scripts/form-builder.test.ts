import assert from "node:assert/strict";
import { test } from "node:test";
import { parseFormDefinition, replicaDateGroups, replicaDateValue, validateFormAnswers } from "../src/lib/formSchema";

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

test("replica signature uses its labelled writing line without covering Place", () => {
  const parsed = parseFormDefinition({
    title: "Officer declaration",
    sections: [{ id: "declaration", fields: [{
      id: "officer_signature", label: "Signature", type: "signature", options: [],
      placement: { page: 1, box: { x: 0.06, y: 0.15, w: 0.75, h: 0.12 }, options: [] },
    }] }],
    pages: [{
      src: "https://example.test/declaration.png", width: 1000, height: 500,
      layer: {
        text: [
          { t: "Signature", x: 0.06, y: 0.10, w: 0.12, h: 0.04, s: 0.018, f: "arial", c: "#000000" },
          { t: "Handtekening", x: 0.80, y: 0.10, w: 0.15, h: 0.04, s: 0.018, f: "arial", c: "#000000" },
          { t: "Place", x: 0.06, y: 0.22, w: 0.10, h: 0.04, s: 0.018, f: "arial", c: "#000000" },
        ],
        rules: [
          { x: 0.20, y: 0.135, w: 0.56, h: 0.002, c: "#000000", d: true },
          { x: 0.20, y: 0.255, w: 0.56, h: 0.002, c: "#000000", d: true },
        ],
      },
    }],
  });
  const box = parsed.sections[0].fields[0].placement!.box!;
  assert.equal(box.x, 0.20);
  assert.equal(box.w, 0.56);
  assert.ok(box.y + box.h <= 0.137, "Signature must end on its own line, not the Place row");
  assert.ok(box.h <= 0.06, "Signature size must follow the printed line, not a tall widget");
  assert.deepEqual(parseFormDefinition(JSON.parse(JSON.stringify(parsed))), parsed);
  const adjusted = structuredClone(parsed);
  const narrower = { x: 0.23, y: 0.105, w: 0.40, h: 0.025 };
  adjusted.sections[0].fields[0].placement!.box = narrower;
  assert.deepEqual(parseFormDefinition(adjusted).sections[0].fields[0].placement!.box, narrower);
  adjusted.sections[0].fields[0].type = "text";
  adjusted.sections[0].fields[0].placement!.box = { x: 0.06, y: 0.15, w: 0.75, h: 0.12 };
  assert.deepEqual(parseFormDefinition(adjusted).sections[0].fields[0].placement!.box, box);
});

const splitDateDefinition = {
  title: "Declaration date",
  sections: [{ id: "declaration", fields: [
    { id: "signed_year", label: "Date - Year", type: "text", options: [], placement: { page: 1, box: { x: 0.3, y: 0.5, w: 0.16, h: 0.06 }, options: [] } },
    { id: "signed_month", label: "Date - Month", type: "text", options: [], placement: { page: 1, box: { x: 0.46, y: 0.5, w: 0.08, h: 0.06 }, options: [] } },
    { id: "signed_day", label: "Date - Day", type: "text", options: [], placement: { page: 1, box: { x: 0.54, y: 0.5, w: 0.08, h: 0.06 }, options: [] } },
  ] }],
  pages: [{ src: "https://example.test/declaration.png", width: 1000, height: 500 }],
};

test("replica split date validates one calendar date across the saved field ids", () => {
  const parsed = parseFormDefinition(splitDateDefinition);
  const fields = ["signed_year", "signed_month", "signed_day"];
  assert.deepEqual(Object.keys(validateFormAnswers(parsed, { signed_year: "sdfgsdfg", signed_month: "sfg", signed_day: "sdfg" })), fields);
  assert.deepEqual(Object.keys(validateFormAnswers(parsed, { signed_year: "2026", signed_month: "02", signed_day: "31" })), fields);
  assert.deepEqual(Object.keys(validateFormAnswers(parsed, { signed_year: "2026" })), fields);
  assert.deepEqual(validateFormAnswers(parsed, { signed_year: "2024", signed_month: "02", signed_day: "29" }), {});
  assert.deepEqual(validateFormAnswers(parsed, {}), {});
});

test("replica split dates use printed bilingual labels and preserve a century prefix", () => {
  const raw = structuredClone(splitDateDefinition);
  raw.sections[0].fields.forEach((field, index) => { field.label = `Input ${index + 1}`; });
  const parsed = parseFormDefinition({
    ...raw,
    pages: [{ ...raw.pages[0], layer: { text: [
      { t: "Y/J", x: 0.365, y: 0.565, w: 0.03, h: 0.03, s: 0.016, f: "arial", c: "#000000" },
      { t: "M", x: 0.49, y: 0.565, w: 0.02, h: 0.03, s: 0.016, f: "arial", c: "#000000" },
      { t: "D", x: 0.57, y: 0.565, w: 0.02, h: 0.03, s: 0.016, f: "arial", c: "#000000" },
      { t: "20", x: 0.31, y: 0.51, w: 0.04, h: 0.03, s: 0.016, f: "arial", c: "#000000" },
    ] } }],
  });
  const groups = replicaDateGroups(parsed.sections[0].fields, parsed.pages);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].yearPrefix?.t, "20");
  assert.equal(replicaDateValue(groups[0], { signed_year: "26", signed_month: "9", signed_day: "13" }), "2026-09-13");
  assert.equal(replicaDateValue(groups[0], { signed_year: "1999", signed_month: "9", signed_day: "13" }), "");
  assert.deepEqual(parsed.sections[0].fields.map(field => field.id), ["signed_year", "signed_month", "signed_day"]);
});

test("replica split date does not group distant boxes, different rows or missing parts", () => {
  const raw = structuredClone(splitDateDefinition);
  raw.sections[0].fields[2].placement.box.y = 0.7;
  let parsed = parseFormDefinition(raw);
  assert.deepEqual(replicaDateGroups(parsed.sections[0].fields, parsed.pages), []);
  raw.sections[0].fields[2].placement.box.y = 0.5;
  raw.sections[0].fields[2].placement.box.x = 0.85;
  parsed = parseFormDefinition(raw);
  assert.deepEqual(replicaDateGroups(parsed.sections[0].fields, parsed.pages), []);
  raw.sections[0].fields.pop();
  parsed = parseFormDefinition(raw);
  assert.deepEqual(replicaDateGroups(parsed.sections[0].fields, parsed.pages), []);
});