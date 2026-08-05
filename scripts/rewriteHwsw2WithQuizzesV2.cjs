const fs = require('fs');
const path = require('path');
const filePath = path.join(process.cwd(), 'src', 'data', 'content.ts');
const raw = fs.readFileSync(filePath, 'utf8');

const startKey = '  HWSW2: {';
const startIdx = raw.indexOf(startKey);
const endIdx = raw.indexOf('};', startIdx);
const before = raw.slice(0, startIdx);
const block = raw.slice(startIdx, endIdx + 2);
const after = raw.slice(endIdx + 2);

const lessonStart = block.indexOf('lesson: [');
const lessonEnd = block.indexOf('\r\n    ],', lessonStart);
const lessonBody = block.slice(lessonStart + 'lesson: ['.length, lessonEnd);
const sections = lessonBody.split(/\r\n      \},\r\n      \{\r\n/);
console.log('sections total:', sections.length);

// Parse each section
const parsed = sections.map(sec => {
  const heading = (sec.match(/heading:\s*"([^"]+)"/) || [])[1] || '';
  const paras = [];
  const pMatch = sec.match(/paragraphs:\s*\[([\s\S]*?)\],\s*figures/);
  if (pMatch) {
    for (const m of pMatch[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)) paras.push(m[1]);
  }
  const fMatch = sec.match(/id:\s*"(hwsw2-[^"]+)",\s*caption:\s*"([^"]+)"/);
  return {
    heading,
    figureId: fMatch ? fMatch[1] : null,
    figureCaption: fMatch ? fMatch[2] : null,
    bullets: paras.map(p => p.replace(/^[•\-\u2022]\s*/, '')),
    rawParagraphs: paras,
  };
});

const figures = parsed.filter(p => p.figureId).map(p => ({
  id: p.figureId,
  caption: p.figureCaption,
  bullets: p.bullets,
}));
console.log('figures:', figures.length);

const esc = s => s.replace(/\\/g,'\\\\').replace(/"/g,'\\"');

function pick(arr, k, seed) {
  const out = []; const used = new Set(); let s = seed;
  while (out.length < k) {
    s = (s * 9301 + 49297) % 233280;
    const idx = s % arr.length;
    if (!used.has(idx)) { used.add(idx); out.push(arr[idx]); }
    if (used.size === arr.length) break;
  }
  return out;
}
function shuffle(arr, seed) {
  const a = arr.slice(); let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuiz(fig, figIdx) {
  const otherCaptions = figures.filter((_, i) => i !== figIdx).map(f => f.caption);
  const otherBullets = figures.filter((_, i) => i !== figIdx).flatMap(f => f.bullets);
  const questions = [];

  // Q1: Topic
  {
    const distractors = pick(otherCaptions, 3, figIdx * 7 + 1);
    const opts = shuffle([fig.caption, ...distractors], figIdx * 3 + 11);
    questions.push({
      q: `Which topic does this slide cover?`,
      options: opts,
      answer: opts.indexOf(fig.caption),
      explain: `This slide covers: ${fig.caption}.`,
    });
  }
  // Q2-4: True statement per bullet
  fig.bullets.forEach((bullet, bi) => {
    const distractors = pick(otherBullets, 3, figIdx * 13 + bi * 17 + 3);
    const opts = shuffle([bullet, ...distractors], figIdx * 5 + bi * 7 + 19);
    questions.push({
      q: `Which statement is TRUE?`,
      options: opts,
      answer: opts.indexOf(bullet),
      explain: `Correct: "${bullet}"`,
    });
  });
  // Q5: NOT true
  {
    const distractor = pick(otherBullets, 1, figIdx * 23 + 41)[0];
    const opts = shuffle([...fig.bullets, distractor], figIdx * 11 + 29);
    questions.push({
      q: `Which statement is NOT true?`,
      options: opts,
      answer: opts.indexOf(distractor),
      explain: `"${distractor}" is about a different topic.`,
    });
  }
  while (questions.length < 5) {
    const bullet = fig.bullets[questions.length % Math.max(fig.bullets.length, 1)] || fig.caption;
    const distractors = pick(otherBullets, 3, figIdx * 31 + questions.length);
    const opts = shuffle([bullet, ...distractors], figIdx * 37 + questions.length);
    questions.push({
      q: `Which statement is TRUE?`,
      options: opts,
      answer: opts.indexOf(bullet),
      explain: `Correct: "${bullet}"`,
    });
  }
  return questions.slice(0, 5);
}

const out = [];
out.push('  HWSW2: {');
out.push('    lesson: [');

// Emit sections in original order, adding slideQuiz to slide sections
parsed.forEach((sec, secIdx) => {
  if (sec.figureId) {
    const figIdx = figures.findIndex(f => f.id === sec.figureId);
    const fig = figures[figIdx];
    out.push('      {');
    out.push(`        heading: "${esc(sec.heading)}",`);
    out.push('        icon: "chip",');
    out.push('        flat: true,');
    out.push('        paragraphs: [');
    for (const p of sec.rawParagraphs) out.push(`          "${esc(p)}",`);
    out.push('        ],');
    out.push('        figures: [');
    out.push(`          { id: "${fig.id}", caption: "${esc(fig.caption)}" },`);
    out.push('        ],');
    out.push('        slideQuiz: [');
    for (const q of buildQuiz(fig, figIdx)) {
      out.push('          {');
      out.push(`            q: "${esc(q.q)}",`);
      out.push('            options: [');
      for (const o of q.options) out.push(`              "${esc(o)}",`);
      out.push('            ],');
      out.push(`            answer: ${q.answer},`);
      out.push(`            explain: "${esc(q.explain)}",`);
      out.push('          },');
    }
    out.push('        ],');
    out.push('      },');
  } else {
    // Non-figure section (Welcome/Part 1/Part 2/quizGate) — emit only if it's not the old quizGate
    if (/final quiz/i.test(sec.heading)) return; // drop old final quiz gate
    out.push('      {');
    out.push(`        heading: "${esc(sec.heading)}",`);
    out.push('        icon: "presenter",');
    out.push('        flat: true,');
    out.push('        paragraphs: [');
    for (const p of sec.rawParagraphs) out.push(`          "${esc(p)}",`);
    out.push('        ],');
    out.push('        figures: [],');
    out.push('      },');
  }
});

out.push('    ],');
out.push('    exercises: [],');
out.push('    assignments: [],');
out.push('    quiz: [');
// Keep small unit-level quiz for legacy consumers (first 5 slides Q1)
figures.slice(0, 5).forEach((fig, i) => {
  const q = buildQuiz(fig, i)[0];
  out.push('      {');
  out.push(`        q: "${esc(q.q)}",`);
  out.push('        options: [');
  for (const o of q.options) out.push(`          "${esc(o)}",`);
  out.push('        ],');
  out.push(`        answer: ${q.answer},`);
  out.push(`        explain: "${esc(q.explain)}",`);
  out.push('      },');
});
out.push('    ],');
out.push('  },');
out.push('};');

fs.writeFileSync(filePath, before + out.join('\r\n') + after, 'utf8');
console.log('DONE — figures with quizzes:', figures.length);
