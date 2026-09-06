// MARKING STANDARD QA sweep over EVERY exercise question in EVERY unit
// standard. Run `npm run dev`, then open http://localhost:5173/scripts/marking-sweep.html
// For each check, a simulated learner submits the model answer
// itself (every line). Standard asserted:
//   A. full marks — every key idea credited deterministically
//   B. renderer places every earned pair at the END of a statement (never
//      mid-sentence) and shows exactly one pair per credited idea
//   C. no statement boundary falls inside an abbreviation (e.g., i.e., Mr. …)
import { CONTENT } from "../src/data/content";
import { creditConcepts, MarkedAnswer, __markingInternals } from "../src/pages/Course";
import type { ExerciseCheck } from "../src/types";
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { flushSync } from "react-dom";

interface Fail {
  us: string;
  q: number;
  kind: string;
  detail: string;
}

const fails: Fail[] = [];
let total = 0;

const host = document.createElement("div");
document.body.appendChild(host);

for (const [us, content] of Object.entries(CONTENT)) {
  const checks: { check: ExerciseCheck; where: string }[] = [];
  const anyContent = content as unknown as {
    exercises?: { id?: string; checks?: ExerciseCheck[] }[];
    questionSessions?: { id?: string; checks?: ExerciseCheck[] }[];
  };
  for (const ex of anyContent.exercises ?? []) {
    for (const c of ex.checks ?? []) checks.push({ check: c, where: String(ex.id ?? "ex") });
  }
  for (const ex of anyContent.questionSessions ?? []) {
    for (const c of ex.checks ?? []) checks.push({ check: c, where: String(ex.id ?? "qs") });
  }

  checks.forEach(({ check }, qi) => {
    if (!check?.answer?.length || !check?.concepts?.length) return;
    total++;
    const answer = check.answer.join("\n");

    // A — scoring: model answer must earn every concept
    const { credited } = creditConcepts(answer, check);
    if (credited.length < check.concepts.length) {
      const missing = check.concepts
        .map((_, gi) => gi)
        .filter((gi) => !credited.includes(gi))
        .map((gi) => check.labels?.[gi] ?? check.concepts[gi][0]);
      fails.push({ us, q: qi, kind: "score", detail: `model answer earned ${credited.length}/${check.concepts.length}; missing: ${missing.join(" | ")}` });
    }

    // B — rendering: pairs only at statement ends, count == credited count
    const root = createRoot(host);
    flushSync(() => {
      root.render(createElement(MarkedAnswer, { text: answer, check, ok: true }));
    });
    const segs = [...host.querySelectorAll(".exq-seg")];
    let pairCount = 0;
    for (const seg of segs) {
      // C — statement boundaries: no statement may end inside an abbreviation
      // or decimal ("e.g.", "i.e.", "a.m.", "Mr.", "2.") — those dots are not
      // sentence ends and a tick pair must never sit after them.
      const segText = (seg.textContent ?? "").replace(/[✓\s]+$/g, "").trim();
      if (/\b(e\.g\.|i\.e\.|a\.m\.|p\.m\.|vs\.|Mr\.|Mrs\.|Ms\.|Dr\.)$/i.test(segText)) {
        fails.push({ us, q: qi, kind: "boundary", detail: `statement ends inside abbreviation: "…${segText.slice(-40)}"` });
      }
      const ticks = [...seg.querySelectorAll(".exq-ticks")];
      pairCount += ticks.length;
      for (const t of ticks) {
        // a tick must live inside the tail wrapper (end of statement)
        if (!t.closest(".exq-tail")) {
          fails.push({ us, q: qi, kind: "placement", detail: `tick outside statement tail in "${(seg.textContent ?? "").slice(0, 60)}…"` });
        }
        // nothing but more ticks may follow it inside the tail
        let sib = t.nextSibling as Element | null;
        while (sib) {
          if (!(sib instanceof Element) || !sib.classList.contains("exq-ticks")) {
            fails.push({ us, q: qi, kind: "placement", detail: `content after tick in "${(seg.textContent ?? "").slice(0, 60)}…"` });
            break;
          }
          sib = sib.nextSibling as Element | null;
        }
      }
    }
    const leftoverTicks = [...host.querySelectorAll(".exq-marked > .exq-ticks")].length;
    pairCount += leftoverTicks;
    if (leftoverTicks > 0) {
      fails.push({ us, q: qi, kind: "placement", detail: `${leftoverTicks} orphan pair(s) not attached to any statement` });
    }
    if (pairCount !== credited.length) {
      fails.push({ us, q: qi, kind: "count", detail: `rendered ${pairCount} pairs for ${credited.length} credited ideas` });
    }
    flushSync(() => root.unmount());
  });
}

const summary = { total, failures: fails.length, byKind: {} as Record<string, number> };
for (const f of fails) summary.byKind[f.kind] = (summary.byKind[f.kind] ?? 0) + 1;
console.log("SWEEP RESULT", JSON.stringify(summary));
for (const f of fails.slice(0, 40)) console.log(`FAIL ${f.us} #${f.q} [${f.kind}] ${f.detail}`);
(document.getElementById("root") as HTMLElement).textContent =
  `SWEEP: ${total} questions, ${fails.length} failures — see console`;
(window as unknown as { SWEEP: unknown }).SWEEP = { summary, fails };
(window as unknown as { PROBE: unknown }).PROBE = { CONTENT, creditConcepts, internals: __markingInternals };
