import assert from "node:assert/strict";
import { SlideEditHistory } from "../src/lib/slideEditHistory.ts";

const history = new SlideEditHistory();
assert.equal(history.undo(), undefined);
assert.equal(history.redo(), undefined);
for (let i = 0; i < 12; i++) history.record({ field: 0, before: String(i), after: String(i + 1) });
assert.equal(history.undoCount, 10);
for (let i = 11; i >= 2; i--) assert.equal(history.undo()?.before, String(i));
assert.equal(history.undo(), undefined, "Older edits must fall outside the ten-edit limit");
assert.equal(history.redoCount, 10);
for (let i = 3; i <= 12; i++) assert.equal(history.redo()?.after, String(i));
assert.equal(history.redo(), undefined);

history.undo();
history.record({ field: 0, before: "11", after: "11" });
assert.equal(history.redoCount, 1, "No-op commands must preserve redo");
history.record({ field: 1, before: "Heading", after: "<b>Heading</b>" });
assert.equal(history.redoCount, 0, "A new edit must discard the redo branch");
assert.deepEqual(history.undo(), { field: 1, before: "Heading", after: "<b>Heading</b>" });
assert.equal(history.undo()?.field, 0, "Undo must follow edit order across text fields");
assert.equal(history.redo()?.field, 0);
assert.equal(history.redo()?.after, "<b>Heading</b>", "Formatting must survive redo");
assert.equal(new SlideEditHistory().undoCount, 0, "New editing sessions start empty");
console.log("Slide edit history checks passed.");
