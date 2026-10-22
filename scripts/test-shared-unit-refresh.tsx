import { createRoot } from "react-dom/client";
import { useBuiltUnit } from "../src/lib/useBuiltUnit";
import { builtUnitKey } from "../src/lib/builtUnits";
import { clearUnitPacks, rememberUnitPack, unitPackSnapshot } from "../src/lib/unitStorage";

const tick = () => new Promise(resolve => setTimeout(resolve, 50));
function assert(value: unknown, message: string) { if (!value) throw new Error(message); }
async function waitFor(check: () => boolean, message: string) {
  for (let i = 0; i < 100; i++) { if (check()) return; await tick(); }
  throw new Error(message);
}
function pack(count: number) {
  return JSON.stringify({ revision: "stable-revision", files: {}, createdAt: "2026-10-22", source: "Fixture",
    content: { lesson: Array.from({ length: count }, (_, i) => ({ heading: `Slide ${i + 1}`, paragraphs: ["Short lesson text."] })),
      exercises: [], assignments: [], quiz: [] } });
}
let value: string | null = pack(33);
let updated = "version-1";
let offline = false;
let pending = false;
let reads = 0;
let payloadReads = 0;
let release: (() => void) | undefined;
let delayPayload = false;
let poll: (() => void) | undefined;
const setIntervalOriginal = window.setInterval.bind(window);
window.setInterval = (handler: TimerHandler, timeout?: number, ...args: any[]) => {
  if (timeout === 15_000 && typeof handler === "function") poll = () => handler(...args);
  return setIntervalOriginal(handler, timeout, ...args);
};
const key = builtUnitKey("114074");
Object.assign(globalThis, {
  testPending: () => pending,
  testCloud: { from(table: string) {
    assert(table === "shared_state", "Reads shared course content");
    let columns = "";
    const filters: Record<string, string> = {};
    const query = {
      select(next: string) { columns = next; return query; },
      eq(field: string, next: string) { filters[field] = next; return query; },
      async maybeSingle() {
        assert(filters.tenant_id === "investec" && filters.key === key, "Reads exact tenant and unit key");
        reads++;
        if (offline) return { data: null, error: { message: "Offline" } };
        const data = value === null ? null : { updated_at: updated, ...(columns.includes("value") ? { value } : {}) };
        if (columns.includes("value")) {
          payloadReads++;
          if (delayPayload) { delayPayload = false; await new Promise<void>(resolve => { release = resolve; }); }
        }
        return { data, error: null };
      },
    };
    return query;
  } },
});
function Probe({ role }: { role: string }) {
  const unit = useBuiltUnit("114074");
  return <output data-role={role}>{unit?.content.lesson.length ?? 0}</output>;
}
const count = (role = "Learner") => document.querySelector(`[data-role="${role}"]`)?.textContent;
async function test() {
  const root = createRoot(document.getElementById("fixture")!);
  for (const staleCount of [20, 24, 21]) {
    clearUnitPacks();
    rememberUnitPack(key, pack(staleCount));
    root.render(<><Probe role="Learner"/><Probe role="Super User"/></>);
    await waitFor(() => count() === "33" && count("Super User") === "33", `${staleCount} stale slides refresh to 33 for both roles`);
    const loaded = payloadReads;
    window.dispatchEvent(new Event("focus")); await tick();
    assert(payloadReads === loaded, "Unchanged packs are not downloaded again");
    root.render(null); await tick();
  }
  root.render(<Probe role="Learner"/>); await tick();
  value = pack(34); updated = "version-2";
  assert(poll, "A periodic shared-version check is scheduled");
  poll!();
  await waitFor(() => count() === "34", "Polling refreshes same-revision slide edits without signing in again");
  offline = true; value = pack(35); updated = "version-3";
  window.dispatchEvent(new Event("focus")); await tick();
  assert(count() === "34", "Offline errors preserve last available content");
  offline = false; window.dispatchEvent(new Event("online"));
  await waitFor(() => count() === "35", "Reconnect refreshes the unit");
  pending = true; value = pack(36); updated = "version-4";
  window.dispatchEvent(new Event("focus")); await tick();
  assert(count() === "35", "Unsaved local edits are protected");
  pending = false; delayPayload = true;
  window.dispatchEvent(new Event("focus"));
  await waitFor(() => !!release, "Delayed request is in flight");
  rememberUnitPack(key, pack(37)); release!(); release = undefined; await tick();
  assert(count() === "37", "An older response cannot overwrite a new local save");
  value = pack(37); updated = "version-5";
  window.dispatchEvent(new Event("focus")); await tick();
  value = null; window.dispatchEvent(new Event("focus"));
  await waitFor(() => count() === "0", "Deleted published material is removed from cache");
  assert(unitPackSnapshot(key) === null, "Deleted pack cannot reappear from stale storage");
  root.render(null); await tick();
  const stopped = reads;
  window.dispatchEvent(new Event("focus")); await tick();
  assert(reads === stopped, "Unmount stops shared refresh requests");
  rememberUnitPack(key, pack(22)); root.render(<Probe role="Learner"/>); await tick();
  assert(count() === "22", "A first missing cloud row preserves an unpublished local build");
  root.unmount();
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: 20/24/21 cached slides converge to published 33 for learners and superusers; same-revision updates, reconnect, offline cache, save races, deletion and cleanup";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
