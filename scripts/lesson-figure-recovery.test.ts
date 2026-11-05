import assert from "node:assert/strict";
import { test } from "node:test";
import { lessonFigureFolder, matchFigureFile, safeFigureId } from "../src/lib/lessonFigureRecovery";

const UUID_A = "0f1e2d3c-4b5a-4697-8877-665544332211";
const UUID_B = "9a8b7c6d-5e4f-4321-9abc-def012345678";

test("figure ids are made storage-safe the same way uploads name their objects", () => {
  assert.equal(safeFigureId("img-123"), "img-123");
  assert.equal(safeFigureId("fig 1/2:a"), "fig_1_2_a");
  assert.equal(safeFigureId("fig.1-2_3"), "fig.1-2_3");
});
test("a unit's figures live in one shared folder below the tenant prefix", () => {
  assert.equal(lessonFigureFolder("244356"), "shared/lessonfigs/244356");
  assert.equal(lessonFigureFolder("custom-abc.244356"), "shared/lessonfigs/custom-abc.244356");
});
test("the newest upload for a figure id is matched from a folder listing", () => {
  const files = [
    { name: `img-7-${UUID_A}.png`, created_at: "2026-01-01T10:00:00Z" },
    { name: `img-7-${UUID_B}.jpg`, created_at: "2026-02-01T10:00:00Z" },
    { name: `img-8-${UUID_A}.png`, created_at: "2026-03-01T10:00:00Z" },
  ];
  assert.equal(matchFigureFile("img-7", files)?.name, `img-7-${UUID_B}.jpg`);
  assert.equal(matchFigureFile("img-8", files)?.name, `img-8-${UUID_A}.png`);
  assert.equal(matchFigureFile("img-7", [files[0], { name: `img-7-${UUID_B}.jpeg`, updated_at: "2025-12-01T00:00:00Z" }])?.name, `img-7-${UUID_A}.png`);
});
test("objects that merely start with the id, or carry a foreign name, are not matched", () => {
  const files = [
    { name: `img-70-${UUID_A}.png` },
    { name: `img-7-${UUID_A}.svg` },
    { name: `img-7-not-a-uuid.png` },
    { name: `img-7-${UUID_A}.png.bak` },
    { name: "cover.png" },
  ];
  assert.equal(matchFigureFile("img-7", files), null);
  assert.equal(matchFigureFile("img-7", []), null);
  assert.equal(matchFigureFile("fig 1", [{ name: `fig_1-${UUID_A}.png` }])?.name, `fig_1-${UUID_A}.png`);
});
