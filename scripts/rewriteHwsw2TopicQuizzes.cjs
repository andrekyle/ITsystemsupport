/*
 * Rewrites the HWSW2 lesson's final assessment into four 15-question
 * quizzes (Hardware, Software, Storage, Processing), bucketed by slide
 * heading. Uses the same content.ts slide bullets as the source of truth.
 *
 *   node .\scripts\rewriteHwsw2TopicQuizzes.cjs
 */
const fs = require("fs");
const path = require("path");

const contentPath = path.join(__dirname, "..", "src", "data", "content.ts");
const raw = fs.readFileSync(contentPath, "utf8");

const startMarker = "  HWSW2: {";
const startIdx = raw.indexOf(startMarker);
if (startIdx < 0) throw new Error("HWSW2 block not found");

// Find HWSW2's lesson: [ ... ] block
const lessonStart = raw.indexOf("lesson: [", startIdx);
if (lessonStart < 0) throw new Error("lesson: [ not found");
const lessonEnd = raw.indexOf("\r\n    ],", lessonStart);
if (lessonEnd < 0) throw new Error("lesson: [ ...] close not found");
const lessonBlock = raw.slice(lessonStart, lessonEnd);

// Split lesson into sections separated by  '},\r\n      {\r\n' (6-space indent)
const sectionSep = /\r\n      \},\r\n      \{\r\n/g;
const sectionTexts = lessonBlock.split(sectionSep);

const sections = [];
for (const text of sectionTexts) {
  // Only take sections that have exactly one figure (real slides)
  const headingMatch = text.match(/heading:\s*"((?:[^"\\]|\\.)*)"/);
  if (!headingMatch) continue;
  const heading = headingMatch[1];
  const figIdMatch = text.match(/id:\s*"(hwsw2-[a-z0-9-]+)"/);
  if (!figIdMatch) continue;
  const figId = figIdMatch[1];

  // Extract paragraphs array as bullets (each "• ..." string)
  const parasMatch = text.match(/paragraphs:\s*\[([\s\S]*?)\]/);
  const bullets = [];
  if (parasMatch) {
    const items = parasMatch[1].match(/"((?:[^"\\]|\\.)*)"/g) ?? [];
    for (const it of items) {
      const s = JSON.parse(it).replace(/^•\s*/, "").trim();
      if (s) bullets.push(s);
    }
  }
  sections.push({ heading, figId, bullets });
}

console.log(`Parsed ${sections.length} slide sections`);

// Categorize each section into one of Hardware / Software / Storage / Processing
function bucketFor(sec) {
  const h = sec.heading.toLowerCase();
  const id = sec.figId.toLowerCase();
  // Software topics
  if (
    /software|operating system|kernel|registry|firmware|application|enterprise|web|multimedia|database|programming|utility|cloud|virtualisation|containers|networking software|cybersecurity|ai software/.test(
      h,
    )
  ) {
    return "Software";
  }
  // Storage-focused topics (memory + persistent storage + data units)
  if (
    /storage|ssd|hdd|nvme|m\.2|sata|dimm|ram|memory|data units|history of storage|how much information/.test(
      h,
    )
  ) {
    return "Storage";
  }
  // Processing-focused topics (CPUs, GPUs, cache, socket, VRM, cooling, AI hardware)
  if (
    /cpu|processor|gpu|npu|cache|socket|vrm|cooler|cooling|thermal|graphics and ai hardware|modern ai pc hardware/.test(
      h,
    )
  ) {
    return "Processing";
  }
  // Everything else (motherboard, BIOS/UEFI, CMOS, PSU, case, ports, I/O, expansion,
  // input/output devices, networking hardware, four-components map) → Hardware
  return "Hardware";
}

const buckets = { Hardware: [], Software: [], Storage: [], Processing: [] };
for (const sec of sections) {
  buckets[bucketFor(sec)].push(sec);
}
for (const k of Object.keys(buckets)) {
  console.log(`  ${k}: ${buckets[k].length} slides`);
}

// Deterministic PRNG so re-runs are stable
function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuiz(topic, mySections, otherSections, seed) {
  const rng = makeRng(seed);
  // Flat list of every bullet in mySections along with its source heading
  const myBullets = [];
  for (const sec of mySections) {
    for (const b of sec.bullets) myBullets.push({ text: b, heading: sec.heading });
  }
  const otherBullets = [];
  for (const sec of otherSections) {
    for (const b of sec.bullets) otherBullets.push({ text: b, heading: sec.heading });
  }
  // Deduplicate by text
  const seen = new Set();
  const uniqueMy = myBullets.filter((x) => (seen.has(x.text) ? false : (seen.add(x.text), true)));
  seen.clear();
  const uniqueOther = otherBullets.filter((x) => (seen.has(x.text) ? false : (seen.add(x.text), true)));

  const questions = [];
  // A) 8 "which statement is TRUE about {topic}" questions
  //    correct = one of my bullets; 3 distractors from other buckets
  const myShuffled = shuffle(rng, uniqueMy);
  const otherShuffled = shuffle(rng, uniqueOther);
  let otherIdx = 0;
  for (let i = 0; i < 8 && i < myShuffled.length; i++) {
    const correct = myShuffled[i].text;
    const distractors = [];
    while (distractors.length < 3 && otherIdx < otherShuffled.length) {
      const cand = otherShuffled[otherIdx++].text;
      if (cand !== correct && !distractors.includes(cand)) distractors.push(cand);
    }
    while (distractors.length < 3) {
      // fall back to other my bullets
      const cand = myShuffled[(i + distractors.length + 1) % myShuffled.length].text;
      if (cand !== correct && !distractors.includes(cand)) distractors.push(cand);
    }
    const opts = shuffle(rng, [correct, ...distractors]);
    const answer = opts.indexOf(correct);
    questions.push({
      q: `Which statement about ${topic.toLowerCase()} is TRUE?`,
      options: opts,
      answer,
      explain: `Correct: "${correct}"`,
    });
  }
  // B) 4 "which is NOT true" — 3 correct my-bullets + 1 clearly-other bullet
  for (let i = 0; i < 4 && myShuffled.length >= 3; i++) {
    const base = i * 3;
    const c1 = myShuffled[(base + 0) % myShuffled.length].text;
    const c2 = myShuffled[(base + 1) % myShuffled.length].text;
    const c3 = myShuffled[(base + 2) % myShuffled.length].text;
    let wrong = otherShuffled[otherIdx++ % otherShuffled.length].text;
    // Guard against collisions
    let tries = 0;
    while ((wrong === c1 || wrong === c2 || wrong === c3) && tries < otherShuffled.length) {
      wrong = otherShuffled[otherIdx++ % otherShuffled.length].text;
      tries++;
    }
    const opts = shuffle(rng, [c1, c2, c3, wrong]);
    const answer = opts.indexOf(wrong);
    questions.push({
      q: `Which of the following is NOT a fact about ${topic.toLowerCase()}?`,
      options: opts,
      answer,
      explain: `"${wrong}" is about a different topic.`,
    });
  }
  // C) 3 "which topic belongs to {topic}?" — heading matching
  const myHeadings = Array.from(new Set(mySections.map((s) => s.heading)));
  const otherHeadings = Array.from(new Set(otherSections.map((s) => s.heading)));
  const myHShuf = shuffle(rng, myHeadings);
  const otherHShuf = shuffle(rng, otherHeadings);
  let ohi = 0;
  for (let i = 0; i < 3 && i < myHShuf.length; i++) {
    const correct = myHShuf[i];
    const distractors = [];
    while (distractors.length < 3 && ohi < otherHShuf.length) {
      const cand = otherHShuf[ohi++];
      if (cand !== correct && !distractors.includes(cand)) distractors.push(cand);
    }
    const opts = shuffle(rng, [correct, ...distractors]);
    const answer = opts.indexOf(correct);
    questions.push({
      q: `Which of these slides is part of the ${topic} topic?`,
      options: opts,
      answer,
      explain: `"${correct}" belongs to the ${topic} topic.`,
    });
  }
  // Trim/pad to exactly 15
  while (questions.length > 15) questions.pop();
  return questions;
}

const topics = ["Hardware", "Software", "Storage", "Processing"];
const quizzes = topics.map((topic, ti) => {
  const my = buckets[topic];
  const others = [];
  for (const t of topics) if (t !== topic) others.push(...buckets[t]);
  return {
    id: `hwsw2-${topic.toLowerCase()}`,
    title: `${topic} — 15-question knowledge check`,
    questions: buildQuiz(topic, my, others, 1000 + ti),
  };
});

for (const q of quizzes) {
  console.log(`  ${q.id}: ${q.questions.length} questions`);
}

// Emit as source snippet
function stringify(q) {
  const lines = ["    quizzes: ["];
  for (const quiz of quizzes) {
    lines.push("      {");
    lines.push(`        id: ${JSON.stringify(quiz.id)},`);
    lines.push(`        title: ${JSON.stringify(quiz.title)},`);
    lines.push("        questions: [");
    for (const qq of quiz.questions) {
      lines.push("          {");
      lines.push(`            q: ${JSON.stringify(qq.q)},`);
      lines.push("            options: [");
      for (const o of qq.options) lines.push(`              ${JSON.stringify(o)},`);
      lines.push("            ],");
      lines.push(`            answer: ${qq.answer},`);
      lines.push(`            explain: ${JSON.stringify(qq.explain)},`);
      lines.push("          },");
    }
    lines.push("        ],");
    lines.push("      },");
  }
  lines.push("    ],");
  lines.push("    quiz: [],");
  return lines.join("\r\n");
}
const snippet = stringify();

// Replace the current `quiz: [ ... ],` at the end of HWSW2 with the new
// `quizzes: [ ... ], quiz: [],` block.
// Find the last `    quiz: [` before the closing `  },\r\n};` of HWSW2.
const hwsw2CloseIdx = raw.indexOf("  },\r\n};", startIdx);
if (hwsw2CloseIdx < 0) throw new Error("HWSW2 close not found");
const quizStart = raw.lastIndexOf("    quiz: [", hwsw2CloseIdx);
if (quizStart < 0) throw new Error("final quiz: [ not found");
const quizEnd = raw.indexOf("\r\n    ],", quizStart);
if (quizEnd < 0) throw new Error("final quiz close not found");
const before = raw.slice(0, quizStart);
const after = raw.slice(quizEnd + "\r\n    ],".length);
const next = before + snippet + after;
fs.writeFileSync(contentPath, next);
console.log(`Wrote ${contentPath}`);
