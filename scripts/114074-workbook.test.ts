import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { LEARNER_WORKBOOK_114074 } from "../src/data/learnerWorkbook114074";
import { parseFormDefinition } from "../src/lib/formSchema";

const filename = "SAQA-114074 -   Learner Workbook.pdf";
test("114074 workbook retains every source page and printed text item", { skip: !existsSync(filename) && "The original supplied PDF is not present." }, async () => {
  const loading = getDocument({ data: new Uint8Array(readFileSync(filename)), useSystemFonts: true });
  try {
    const pdf = await loading.promise;
    const definition = LEARNER_WORKBOOK_114074.replica!;
    assert.equal(pdf.numPages, 18);
    assert.equal(definition.pages.length, pdf.numPages);
    for (let index = 0; index < pdf.numPages; index++) {
      const page = await pdf.getPage(index + 1);
      const source = await page.getTextContent();
      const runs = definition.pages[index].layer!.text.map(run => run.t);
      const items = source.items.flatMap(item => "str" in item && item.str.trim() ? [item.str.trim()] : []);
      assert.deepEqual(runs.map(text => text.trim()).sort(), items.sort(), `Every source text run remains on page ${index + 1}, including repeated text.`);
      assert.equal(definition.pages[index].width / definition.pages[index].height, definition.pages[0].width / definition.pages[0].height);
    }
  } finally { await loading.destroy(); }
});

test("114074 fields and complete HTML layers survive persisted-content validation", () => {
  const original = LEARNER_WORKBOOK_114074.replica!;
  const parsed = parseFormDefinition(original);
  assert.equal(parsed.pages.length, 18);
  assert.equal(parsed.display, "digital");
  assert.equal(parsed.pages.reduce((sum, page) => sum + page.layer!.text.length, 0), 607);
  const fields = parsed.sections.flatMap(section => section.fields);
  assert.equal(fields.length, 97);
  assert.equal(new Set(fields.map(field => field.id)).size, 97);
  assert.equal(fields.filter(field => field.id.startsWith("activity-")).length, 8);
  for (const field of fields) {
    const placement = field.placement!;
    assert.ok(placement.page >= 1 && placement.page <= 18);
    for (const box of [placement.box, ...placement.options]) {
      if (!box) continue;
      assert.ok(box.x >= 0 && box.y >= 0 && box.w > 0 && box.h > 0);
      assert.ok(box.x + box.w <= 1 && box.y + box.h <= 1, `${field.id} fits on its source page`);
    }
  }
  assert.deepEqual(parsed.pages.map(page => page.layer!.text), original.pages.map(page => page.layer!.text));
});
