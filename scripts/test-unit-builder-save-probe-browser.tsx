import { installSync } from "../src/lib/sync";

function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}

function fillStorage() {
  localStorage.setItem("unrelated-user-data", "Keep this data");
  for (const size of [100000, 1000]) {
    for (let index = 0; index < 10000; index++) {
      try {
        localStorage.setItem(`quota-fixture-${size}-${index}`, "x".repeat(size));
      } catch {
        break;
      }
    }
  }
}

try {
  fillStorage();
  installSync();
  localStorage.setItem("unitbuilder-save-probe.114059", "x".repeat(500000));
  assert(localStorage.getItem("unitbuilder-save-probe.114059") === null, "Unit Builder save probe is ignored instead of stored");
  assert(localStorage.getItem("unrelated-user-data") === "Keep this data", "Unrelated user storage remains untouched");
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: Unit Builder save-probe writes are ignored when browser storage is full";
} catch (error) {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
}
