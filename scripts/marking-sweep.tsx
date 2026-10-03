// MARKING STANDARD QA sweep over EVERY exercise question in EVERY unit
// standard. Run `npm run dev`, then open http://localhost:5173/scripts/marking-sweep.html
// For each check, a simulated learner submits the model answer
// itself (every line = one answer box). Standard asserted:
//   A. full marks — every key idea credited deterministically
//   B. BOX RULE rendering — a line shows AT MOST one ✓✓ pair, at the very
//      END of its text; total pairs == credited ideas; no orphan pairs
//   C. content alignment — every check has exactly one model line per key
//      idea, and line i carries concept i (one box per idea is achievable)
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

const noisyTailCheck: ExerciseCheck = {
  answer: [
    "Types of network resources include hardware like printers and servers, software applications, files, and data stored on the network that users can access and share.",
    "Resources can be stored in primary memory, secondary storage like hard disks, or accessed via file systems that organize data into directories and files for easier management.",
    "Managed network devices include routers, switches, and firewalls, as well as services like email and internet access provided through the network.",
  ],
  concepts: [["network resources"], ["storage types"], ["network devices"]],
};
const noisyTailAnswer = [
  noisyTailCheck.answer[0],
  noisyTailCheck.answer[1],
  "Andre is not responsible for supervising all managed resources, which encompass network infrastructure like routers and cars, alongside essential connectivity assets such as corporate email and internet access for dancing in the rain.",
].join("\n");
total++;
if (creditConcepts(noisyTailAnswer, noisyTailCheck, new Set([2])).credited.includes(2)) {
  fails.push({
    us: "marking-regression",
    q: 0,
    kind: "noise-tail",
    detail: "LLM promotion credited an answer ending in unrelated text",
  });
}
const aiApprovedWithoutFinalIdea = new Set([0, 1]);
total++;
if (
  creditConcepts(noisyTailAnswer, noisyTailCheck, aiApprovedWithoutFinalIdea, aiApprovedWithoutFinalIdea)
    .credited.includes(2)
) {
  fails.push({
    us: "marking-regression",
    q: 1,
    kind: "meaning-review",
    detail: "A concept rejected by OpenAI received deterministic credit",
  });
}
const allNoisyTailIdeasApproved = new Set([0, 1, 2]);
total++;
if (
  creditConcepts(noisyTailCheck.answer.join("\n"), noisyTailCheck, allNoisyTailIdeasApproved, allNoisyTailIdeasApproved)
    .credited.length !== noisyTailCheck.concepts.length
) {
  fails.push({
    us: "marking-regression",
    q: 2,
    kind: "meaning-review",
    detail: "OpenAI-approved model answers did not retain full credit",
  });
}
const contradictoryAnswer = [
  noisyTailCheck.answer[0],
  noisyTailCheck.answer[1],
  "Managed network devices are not routers, switches, or firewalls; network services are not email or internet access, and they are not provided through the network.",
].join("\n");
total++;
if (!creditConcepts(contradictoryAnswer, noisyTailCheck).credited.includes(2)) {
  fails.push({
    us: "marking-regression",
    q: 3,
    kind: "meaning-review",
    detail: "Contradiction regression no longer reproduces a deterministic false positive",
  });
}
if (
  creditConcepts(contradictoryAnswer, noisyTailCheck, aiApprovedWithoutFinalIdea, aiApprovedWithoutFinalIdea)
    .credited.includes(2)
) {
  fails.push({
    us: "marking-regression",
    q: 3,
    kind: "meaning-review",
    detail: "A deterministic keyword match overrode OpenAI's rejection",
  });
}

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

    // C — content alignment: one model line per key idea, line i carries
    // concept i. Guarantees the guide's boxes map 1:1 onto the model answer.
    if (check.answer.length !== check.concepts.length) {
      fails.push({ us, q: qi, kind: "alignment", detail: `${check.answer.length} model lines for ${check.concepts.length} key ideas` });
    } else {
      check.concepts.forEach((g, gi) => {
        if (!__markingInternals.conceptInSentence(g, __markingInternals.answerTokens(check.answer[gi]))) {
          fails.push({ us, q: qi, kind: "alignment", detail: `line ${gi} does not carry concept "${check.labels?.[gi] ?? g[0]}"` });
        }
      });
    }

    // A — scoring: model answer must earn every concept
    const { credited } = creditConcepts(answer, check);
    if (credited.length < check.concepts.length) {
      const missing = check.concepts
        .map((_, gi) => gi)
        .filter((gi) => !credited.includes(gi))
        .map((gi) => check.labels?.[gi] ?? check.concepts[gi][0]);
      fails.push({ us, q: qi, kind: "score", detail: `model answer earned ${credited.length}/${check.concepts.length}; missing: ${missing.join(" | ")}` });
    }

    // B — BOX RULE rendering: at most ONE pair per line, at the line's end
    const root = createRoot(host);
    flushSync(() => {
      root.render(createElement(MarkedAnswer, { text: answer, check, ok: true }));
    });
    const segs = [...host.querySelectorAll(".exq-seg")];
    let pairCount = 0;
    for (const seg of segs) {
      const ticks = [...seg.querySelectorAll(".exq-ticks")];
      pairCount += ticks.length;
      if (ticks.length > 1) {
        fails.push({ us, q: qi, kind: "boxrule", detail: `${ticks.length} pairs on one line: "${(seg.textContent ?? "").slice(0, 60)}…"` });
      }
      for (const t of ticks) {
        // a pair must live inside the tail wrapper (end of the line)
        if (!t.closest(".exq-tail")) {
          fails.push({ us, q: qi, kind: "placement", detail: `pair outside line tail in "${(seg.textContent ?? "").slice(0, 60)}…"` });
        }
        // nothing may follow the pair inside the tail
        let sib = t.nextSibling as Element | null;
        while (sib) {
          if (!(sib instanceof Element) || !sib.classList.contains("exq-ticks")) {
            fails.push({ us, q: qi, kind: "placement", detail: `content after pair in "${(seg.textContent ?? "").slice(0, 60)}…"` });
            break;
          }
          sib = sib.nextSibling as Element | null;
        }
      }
    }
    const leftoverTicks = [...host.querySelectorAll(".exq-marked > .exq-ticks")].length;
    pairCount += leftoverTicks;
    if (leftoverTicks > 0) {
      fails.push({ us, q: qi, kind: "placement", detail: `${leftoverTicks} orphan pair(s) not attached to any line` });
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
