const fs = require('fs');
const path = require('path');
const filePath = path.join(process.cwd(), 'src', 'data', 'content.ts');
const raw = fs.readFileSync(filePath, 'utf8');

// Locate HWSW2 lesson block
const startKey = '  HWSW2: {';
const startIdx = raw.indexOf(startKey);
if (startIdx < 0) { console.error('HWSW2 start not found'); process.exit(1); }
// Find end: matching "  },\n};" but before "export function getContent"
const exportIdx = raw.indexOf('export function getContent', startIdx);
// Find the '  },' immediately before exportIdx
let endBrace = raw.lastIndexOf('  },', exportIdx);
// Verify it's the HWSW2 closing (the pattern " };\n\nexport" precedes)
const closeSemi = raw.indexOf('};', endBrace);
if (closeSemi < 0) { console.error('close not found'); process.exit(1); }

const before = raw.slice(0, startIdx);
const oldBlock = raw.slice(startIdx, closeSemi + 2); // include '};'
const after = raw.slice(closeSemi + 2);

// Extract figures with bullets from oldBlock: match { id: "...", caption: "...", bullets: [ "...", ... ] }
const figRegex = /\{\s*id:\s*"([^"]+)",\s*caption:\s*"([^"]+)",\s*bullets:\s*\[([\s\S]*?)\]\s*,?\s*\}/g;
const figures = [];
let m;
while ((m = figRegex.exec(oldBlock)) !== null) {
  const id = m[1];
  const caption = m[2];
  const bulletBlock = m[3];
  const bullets = [];
  const bRegex = /"((?:[^"\\]|\\.)*)"/g;
  let b;
  while ((b = bRegex.exec(bulletBlock)) !== null) {
    bullets.push(b[1]);
  }
  figures.push({ id, caption, bullets });
}
console.log('Extracted figures:', figures.length);
figures.forEach(f => console.log(' -', f.id, '(', f.bullets.length, 'bullets)'));

// Structural groupings — insert dividers before the FIRST figure whose id matches the group's first id.
const groups = [
  { header: 'PART 1 — HARDWARE: the physical machine',
    icon: 'chip',
    intro: 'Every slide in Part 1 shows a physical component you can point at inside a PC case. Work outwards from the motherboard: processors, cooling, memory, storage, power, case & ports, input and output devices, and networking hardware.',
    firstId: 'hwsw2-motherboard-components' },
  { header: 'PART 2 — SOFTWARE: the programs that bring the hardware to life',
    icon: 'layers',
    intro: 'Every slide in Part 2 is code — from firmware and the operating system, up through applications, and finally the modern layer of cloud, virtualisation, networking, security and AI software.',
    firstId: 'hwsw2-software-modules-overview' },
];

// Build the new lesson: array
const esc = s => s.replace(/\\/g,'\\\\').replace(/"/g,'\\"');
const out = [];
out.push('  HWSW2: {');
out.push('    lesson: [');

// Welcome section (intro only, no figure)
out.push('      {');
out.push('        heading: "Welcome — one image per slide",');
out.push('        icon: "presenter",');
out.push('        flat: true,');
out.push('        paragraphs: [');
out.push('          "This lesson is a slideshow. Every screen shows one image and a short set of bullet points. Read the bullets, study the picture, then press Next.",');
out.push('          "The deck is split into two parts. Part 1 is hardware — the physical machine. Part 2 is software — the programs that run on it.",');
out.push('          "At the end there is a five-question quiz. You must get all five questions correct before you can finish the lesson.",');
out.push('        ],');
out.push('        figures: [],');
out.push('      },');

for (const fig of figures) {
  // Insert divider if this figure is the first in a group
  const grp = groups.find(g => g.firstId === fig.id);
  if (grp) {
    out.push('      {');
    out.push(`        heading: "${esc(grp.header)}",`);
    out.push(`        icon: "${grp.icon}",`);
    out.push('        flat: true,');
    out.push('        paragraphs: [');
    out.push(`          "${esc(grp.intro)}",`);
    out.push('        ],');
    out.push('        figures: [],');
    out.push('      },');
  }
  // One-figure slide
  out.push('      {');
  out.push(`        heading: "${esc(fig.caption)}",`);
  out.push('        icon: "chip",');
  out.push('        flat: true,');
  out.push('        paragraphs: [');
  for (const b of fig.bullets) {
    out.push(`          "• ${esc(b)}",`);
  }
  out.push('        ],');
  out.push('        figures: [');
  out.push(`          { id: "${fig.id}", caption: "${esc(fig.caption)}" },`);
  out.push('        ],');
  out.push('      },');
}

// Final Quiz gate section
out.push('      {');
out.push('        heading: "Final quiz — answer all five correctly to finish",');
out.push('        icon: "checkCircle",');
out.push('        flat: true,');
out.push('        quizGate: true,');
out.push('        paragraphs: [');
out.push('          "Answer every question. You must get all five correct before the Finish button unlocks.",');
out.push('        ],');
out.push('        figures: [],');
out.push('      },');

out.push('    ],');
out.push('    exercises: [],');
out.push('    assignments: [],');
out.push('    quiz: [');
out.push('      {');
out.push('        q: "In the four-part model of a computer system, which of these is NOT one of the four components?",');
out.push('        options: ["Input", "Processing", "Cloud", "Storage"],');
out.push('        answer: 2,');
out.push('        explain: "The four components are input, processing, storage and output. Cloud is a delivery model, not one of the fundamental components.",');
out.push('      },');
out.push('      {');
out.push('        q: "Which motherboard circuit steps the 12 V rail from the PSU down to roughly 1 V for the CPU?",');
out.push('        options: ["CMOS battery", "VRM (Voltage Regulator Module)", "BIOS chip", "PCIe slot"],');
out.push('        answer: 1,');
out.push('        explain: "The VRM regulates and steps down voltage to the level the CPU actually needs. A weak VRM causes instability under heavy load.",');
out.push('      },');
out.push('      {');
out.push('        q: "You need the fastest possible internal storage for a workstation. Which interface do you pick?",');
out.push('        options: ["SATA HDD", "SATA SSD", "NVMe SSD in an M.2 slot", "USB external SSD"],');
out.push('        answer: 2,');
out.push('        explain: "NVMe SSDs plug directly into PCIe lanes via M.2 and are far faster than SATA-based drives or USB storage.",');
out.push('      },');
out.push('      {');
out.push('        q: "Which of the following is application software, NOT system software?",');
out.push('        options: ["Windows kernel", "Device driver", "Microsoft Excel", "BIOS/UEFI firmware"],');
out.push('        answer: 2,');
out.push('        explain: "Excel is an application — a program users run on top of the OS. The kernel, drivers and firmware are all system-level software.",');
out.push('      },');
out.push('      {');
out.push(`        q: "A modern 'AI PC' typically contains a CPU, a GPU and a third dedicated processor for AI. What is that third chip called?",`);
out.push('        options: ["APU", "TPU", "NPU (Neural Processing Unit)", "DPU"],');
out.push('        answer: 2,');
out.push('        explain: "The NPU is a dedicated Neural Processing Unit designed to run AI workloads efficiently, especially on laptops (Copilot+ PCs).",');
out.push('      },');
out.push('    ],');
out.push('  },');
out.push('};');

const newBlock = out.join('\n');
const finalOut = before + newBlock + after;
fs.writeFileSync(filePath, finalOut, 'utf8');
console.log('DONE. sections:', 1 + groups.length + figures.length + 1);
