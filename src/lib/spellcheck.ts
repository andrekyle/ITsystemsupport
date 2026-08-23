/**
 * Lightweight, in‑browser spell checker used to give students feedback on
 * their typed exercise answers.
 *
 * Strategy — high precision, low false‑positive rate:
 *   1. Maintain a compact dictionary of common English words plus IT / hardware
 *      / software / networking terminology students are expected to use.
 *   2. A word is only reported as misspelled when it looks like a *typo* of a
 *      dictionary word — i.e. there is at least one dictionary word within an
 *      edit distance of 1 (short words) or 2 (longer words).
 *      Unknown words that are *not* close to any dictionary entry (e.g. names,
 *      brands, acronyms, code identifiers, technical jargon that isn't in the
 *      list) are left alone rather than flagged as wrong.
 *   3. Callers may supply extra allowed words (e.g. terminology drawn from the
 *      current lesson's answer key) so lesson‑specific vocabulary is never
 *      flagged as a typo.
 *
 * Everything runs client‑side — no network calls, no external dictionaries. */

/* ---------- dictionary ---------- */

/** Common English words (base forms). Suffixed forms (‑s, ‑es, ‑ed, ‑ing, …)
 *  are accepted automatically at check time — see {@link isKnown}. */
const COMMON_ENGLISH = `
a about above accept access according account across act action activate active add address advance
advice affect after again against age ago agree ahead aid aim air alert all allow almost alone along
already also although always among amount analyse analyze and animal announce another answer any
anyone anything appear apply approach appropriate approve area argue arise around arrange arrive art
article as ask aspect assess assign assist assume assure at attach attack attempt attend audience
author automatic available avoid away back background bad balance base basic be beat because become
been before begin behaviour behavior behind believe below benefit best better between beyond big bill
birth bit black blame block blue board body book both bottom box boy break bring broad brought build
building business but buy by call came camera can cancel cannot capable capacity car card care carry
case catch cause cell centre center certain chain chair challenge chance change channel chapter
character charge chart check choice choose chose city civil claim class clean clear click client close
club code collect college colour color come command comment common community company compare complete
complex computer concept concern condition confirm connect consider consist constant contact contain
content context continue contract control convert copy correct cost could country course court cover
create credit cross culture current customer cut damage danger data date day deal death decide decision
declare decrease deep define degree deliver demand describe design desk detail detect determine develop
device did difference different difficult direct direction directory discuss disk display do document
does domain door double doubt down download draw drive drop due during each early easy edit editor
education effect either electric electronic element else email employ empty end energy engineer enjoy
enough ensure enter entire environment equal equipment error especially essential establish even event
ever every everyone everything evidence exact examine example exchange exclude exist expect experience
experiment explain explore export express extend extra face fact factor fail failed failure family far
fast feature few field figure file fill film final find fine finish first fit five fix flag flat flow
folder follow food foot for force forget form format forward found four free frequent fresh friend from
front full function further future gain game gather general get give go goal good got government great
green ground group grow guide had half hand hang happen happy hard hardware has have head health hear
heart heat help here hidden hide high history hit hold home hope host hour how however human hundred
identify if image imagine immediate impact implement important improve include increase index indicate
industry inform information input inside install instance instead institute instruction interest
international internet interpret introduce invest issue it item its itself job join joint judge just
keep key keyboard kind know knowledge label language large last later latest lead leader learn least
leave left less let letter level library life light like limit line link list listen little live load
local locate location log logic long look loss lost lot love low machine made main maintain major make
manage manager many map mark market material matter may maybe mean measure media medical medium meet
member memory mention menu message method middle might million mind minute miss mission mobile model
modern modify modul module moment money monitor month more morning most mouse move much multiple music
must name national natural nature near necessary need network never new news next nice night no
none nor normal north not note nothing notice now number object obtain obvious of off offer office
often oil old on once one online only open operate operation opinion option or order organise organize
organisation organization other others our out output outside over own owner package page paper part
particular partner party pass past path patient pattern pay peace people per perform performance perhaps
period person personal phone photo physical pick picture piece place plan plane play please plug point
police policy political poor popular port position possible post power practice practise prepare present
prevent previous price primary print printer private probably problem process produce product professional
program project property prove provide public pull purpose push put quality question quick quiet quite
race radio raise range rate rather reach react read reader ready real reality realise realize really
reason receive recent record red reduce refer reflect reform refuse region relate release remain remember
remove repair repeat replace reply report request require research reset resource respond response
responsible rest result return reveal review right ring rise risk role room round route row rule run
safe same save saw say scale scene school science screen search season second section sector see seek
seem select send sense sensor separate serious serve server service session set setting settle several
share she short should show side sign signal similar simple since single site situation six size skill
slide slow small so social society software solid solution some someone something sometime soon sort
sound source south space speak special specific speech speed spend stage stand standard start state
station stay step still stop storage store story straight strategy street strong structure student study
style subject submit success such suddenly suggest suitable summer supply support suppose sure switch
system table take talk task teach team technical technology tell temperature ten term test text than
thank that the their them then there therefore they thing think third this those though thought three
through throw thus time to today together too took tool top total touch toward town track trade traffic
train transfer translate travel treat tree trial trip trouble true trust try turn twelve twenty two type
under understand union unit universal university unless until update upgrade upload upon us use used uses using user
usual value various very video view visit voice wait walk wall want war warm was watch water way we
weather web website week weight welcome well went were west what when where whether which while white
who whole whom whose why wide will win window wire with within without woman word work worker world would
write written wrong wrote year yes yesterday yet you young your yourself zone
spell spelling sentence paragraph grammar punctuation capital lowercase uppercase
tomorrow yesterday afternoon evening morning weekend weekday classroom teacher lecturer
lesson lessons homework assignment assignments exercise exercises exam exams test tests
answer answers question questions correct incorrect complete completed submit submitted
practical theory theoretical practice practices reason reasons explanation explanations
because since due therefore hence thus although however moreover furthermore additionally
regulation regulations regulatory compliance audit auditor feasibility recommendation
recommendations budget budgets expenditure income forecast forecasts finance financial
incident incidents progress status summary conclusion introduction findings appendix
`;

/** Additional IT / hardware / software / networking / cyber‑safety vocabulary
 *  students are expected to use in this course. */
const IT_TERMS = `
adware algorithm antivirus app application arithmetic assembler backup bandwidth binary bios biometric
bit blockchain bluetooth boot broadband browser buffer bug byte cache cd chip circuit client cloud
compile compiler configure cookie copyright cpu cyber cybercrime cybersecurity data database debug
decrypt defragment delete desktop diagnostic digital disk domain dongle download downtime driver dvd
encrypt encryption ethernet execute file firewall firmware format gigabyte gpu graphical graphics
gigahertz hacker hardware hdmi headset hertz hover html http https hyperlink icon input install
integrated interface internet intranet ip ipad iphone joystick keyboard kilobyte laptop laser latency
launch license linux logic login logout mainframe malware megabyte memory microphone microprocessor
microsoft modem monitor motherboard mouse mp3 multimedia network notebook offline online opensource
operating optical output overwrite packet parallel password patch pdf peripheral phishing pixel plagiarism
platform plotter plug plugin podcast port portable power printer processor program programmer programming
protocol proxy python query queue ram ransomware rebooted rebooting reboot recycle refresh register reset
resolution restart restore router runtime satellite scanner screen sector server session shortcut sim
smartphone software solid spam speaker spreadsheet spyware ssd standalone storage streaming stylus subnet
supercomputer surge switch sync syntax system tablet template terabyte terminal tether tethering toner
touchpad touchscreen traffic transistor troubleshoot trojan uninstall unplug update upgrade upload url
usb username utility variable vector version virtual virus vpn wan webcam website widget wifi wireless
workstation worm ergonomics ergonomic sedentary posture repetitive strain eyestrain glare fatigue
recycle recycling refurbish refurbishment sustainable sustainability disposal e-waste
`;

/** Words that should NOT be suggested as corrections (very short / ambiguous). */
const NEVER_SUGGEST = new Set(["a", "i"]);

/** Common suffix stripping rules used to accept inflected forms
 *  (plurals, past tense, ‑ing, comparatives, adverbs, possessives). */
const SUFFIX_RULES: { suffix: string; add: string[] }[] = [
  { suffix: "'s", add: [""] },
  { suffix: "s'", add: [""] },
  { suffix: "ies", add: ["y"] },
  { suffix: "ied", add: ["y"] },
  { suffix: "ier", add: ["y"] },
  { suffix: "iest", add: ["y"] },
  { suffix: "es", add: [""] },
  { suffix: "s", add: [""] },
  { suffix: "ed", add: ["", "e"] },
  { suffix: "ing", add: ["", "e"] },
  { suffix: "er", add: ["", "e"] },
  { suffix: "est", add: ["", "e"] },
  { suffix: "ly", add: [""] },
  { suffix: "ally", add: ["al"] },
];

function tokeniseDict(text: string): string[] {
  return text
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => /^[a-z][a-z'-]*$/.test(w));
}

const BASE_DICT = new Set<string>([...tokeniseDict(COMMON_ENGLISH), ...tokeniseDict(IT_TERMS)]);

/** All dictionary words as an array, used to search for close matches. */
const DICT_ARRAY = Array.from(BASE_DICT);

/** Extract the individual English‑word candidates that appear in a piece of text
 *  extracted from an exercise's answer key or concept list.
 *  Runs of non‑letter characters delimit tokens. */
function extractAllowedFromPhrases(phrases: Iterable<string>): Set<string> {
  const out = new Set<string>();
  for (const p of phrases) {
    for (const raw of String(p).toLowerCase().split(/[^a-z']+/)) {
      if (raw.length >= 2 && /^[a-z][a-z']*$/.test(raw)) out.add(raw);
    }
  }
  return out;
}

/** Attempt to strip a common suffix and return possible base forms. */
function baseForms(word: string): string[] {
  const bases = new Set<string>([word]);
  for (const rule of SUFFIX_RULES) {
    if (word.length > rule.suffix.length + 2 && word.endsWith(rule.suffix)) {
      const stem = word.slice(0, word.length - rule.suffix.length);
      for (const add of rule.add) bases.add(stem + add);
      // handle doubled consonant: "running" -> "run", "stopped" -> "stop"
      if ((rule.suffix === "ing" || rule.suffix === "ed") && stem.length >= 2) {
        const last = stem[stem.length - 1];
        const prev = stem[stem.length - 2];
        if (last === prev && "bcdfghjklmnpqrstvwxz".includes(last)) {
          bases.add(stem.slice(0, -1));
        }
      }
    }
  }
  return Array.from(bases);
}

/** Is a word known to the dictionary (base + inflected forms + caller‑supplied
 *  allow‑list)? */
function isKnown(word: string, allowed: Set<string>): boolean {
  const w = word.toLowerCase();
  if (BASE_DICT.has(w) || allowed.has(w)) return true;
  for (const b of baseForms(w)) {
    if (BASE_DICT.has(b) || allowed.has(b)) return true;
  }
  return false;
}

/* ---------- edit distance ---------- */

/** Damerau–Levenshtein distance capped at {@link limit} — returns `limit + 1`
 *  as soon as it's clear the distance exceeds `limit`, which keeps the check
 *  linear when scanning the whole dictionary. */
function editDistance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  let prev2 = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost // substitution
      );
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        v = Math.min(v, prev2[j - 2] + 1); // transposition
      }
      curr[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > limit) return limit + 1;
    [prev2, prev, curr] = [prev, curr, prev2];
  }
  return prev[n];
}

/* ---------- suggestions ---------- */

/** Find up to {@link maxSuggestions} closest dictionary words to `word`.
 *  Only considers candidates that share the first letter and whose length is
 *  within `limit` of `word` — keeps the scan fast. Caller‑supplied allowed
 *  words (lesson terminology) are searched too, so typos of lesson‑specific
 *  vocabulary are caught even when it isn't in the base dictionary. */
function suggestFor(word: string, limit: number, maxSuggestions = 3, extraCandidates?: Iterable<string>): string[] {
  const w = word.toLowerCase();
  const first = w[0];
  const pool = extraCandidates ? [...DICT_ARRAY, ...extraCandidates] : DICT_ARRAY;
  const scored: { word: string; d: number }[] = [];
  for (const cand of pool) {
    if (cand[0] !== first) continue;
    if (Math.abs(cand.length - w.length) > limit) continue;
    if (NEVER_SUGGEST.has(cand)) continue;
    const d = editDistance(w, cand, limit);
    if (d <= limit) scored.push({ word: cand, d });
  }
  // If no same‑initial candidates match, allow any initial (typo of the first letter).
  if (scored.length === 0) {
    for (const cand of pool) {
      if (Math.abs(cand.length - w.length) > limit) continue;
      if (NEVER_SUGGEST.has(cand)) continue;
      const d = editDistance(w, cand, limit);
      if (d <= limit) scored.push({ word: cand, d });
    }
  }
  scored.sort((a, b) => a.d - b.d || a.word.length - b.word.length || a.word.localeCompare(b.word));
  const out: string[] = [];
  for (const s of scored) {
    if (!out.includes(s.word)) out.push(s.word);
    if (out.length >= maxSuggestions) break;
  }
  return out;
}

/* ---------- public API ---------- */

export interface SpellIssue {
  /** The exact word as it appears in the source text (original case). */
  word: string;
  /** Start index of the word in the source text. */
  start: number;
  /** One past the end index of the word in the source text. */
  end: number;
  /** Suggested corrections drawn from the dictionary, best first. */
  suggestions: string[];
}

/** A text token — either a plain segment of source text or a misspelled word.
 *  Callers can iterate the array to render the answer with misspellings
 *  highlighted while preserving whitespace and punctuation exactly. */
export type SpellSegment =
  | { kind: "text"; text: string }
  | { kind: "bad"; text: string; suggestions: string[] };

/** Split the input into word tokens with their character offsets. */
function* tokensOf(text: string): Generator<{ word: string; start: number; end: number }> {
  const re = /[A-Za-z][A-Za-z'’-]*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const w = m[0].replace(/[’]/g, "'");
    yield { word: w, start: m.index, end: m.index + m[0].length };
  }
}

/** Should this word be considered as a candidate for spell‑checking? */
function isCheckable(word: string): boolean {
  if (word.length < 4) return false; // very short words: not worth flagging
  // Any word starting with a capital letter — sentence starter or mid‑sentence
  // — is treated as a possible proper noun (name, place, brand, acronym) and
  // skipped. The browser's built‑in spell checker still underlines these live
  // in the textarea so real typos aren't silently missed.
  if (/^[A-Z]/.test(word)) return false;
  // Mixed case in middle of the word (e.g. iPhone, YouTube) → brand, skip.
  if (/[a-z][A-Z]/.test(word)) return false;
  // ALL‑CAPS acronym → skip (RAM, CPU, HTML, …).
  if (word === word.toUpperCase()) return false;
  // Contains digits or unusual punctuation → skip.
  if (/[^A-Za-z'-]/.test(word)) return false;
  return true;
}

/** Find misspelled words in `text`.
 *  @param text        The learner's answer.
 *  @param extraAllowed  Optional extra words to treat as correctly spelled
 *                       (e.g. lesson terminology drawn from the answer key). */
export function findMisspellings(text: string, extraAllowed?: Iterable<string>): SpellIssue[] {
  const allowed = extractAllowedFromPhrases(extraAllowed ?? []);
  const issues: SpellIssue[] = [];
  const seen = new Set<string>(); // dedupe suggestions per unique lowercase word
  const suggestCache = new Map<string, string[]>();

  for (const tok of tokensOf(text)) {
    if (!isCheckable(tok.word)) continue;
    if (isKnown(tok.word, allowed)) continue;

    const key = tok.word.toLowerCase();
    let suggestions = suggestCache.get(key);
    if (!suggestions) {
      // Short words: only accept edit distance 1 to keep the flag conservative.
      const limit = tok.word.length <= 4 ? 1 : 2;
      suggestions = suggestFor(tok.word, limit, 3, allowed);
      suggestCache.set(key, suggestions);
    }
    // Only report as misspelled if we found at least one plausible correction —
    // words with no close dictionary neighbour are treated as unknown but not
    // wrong (proper nouns, brand names, unusual technical terms, …).
    if (suggestions.length === 0) continue;

    issues.push({ word: tok.word, start: tok.start, end: tok.end, suggestions });
    seen.add(key);
  }
  return issues;
}

/** Split `text` into an ordered list of text / misspelled‑word segments so a
 *  view layer can render the answer with the wrong spellings highlighted while
 *  preserving whitespace and punctuation. */
export function segmentText(text: string, issues: SpellIssue[]): SpellSegment[] {
  if (issues.length === 0) return [{ kind: "text", text }];
  const out: SpellSegment[] = [];
  let cursor = 0;
  for (const iss of issues) {
    if (iss.start > cursor) out.push({ kind: "text", text: text.slice(cursor, iss.start) });
    out.push({ kind: "bad", text: text.slice(iss.start, iss.end), suggestions: iss.suggestions });
    cursor = iss.end;
  }
  if (cursor < text.length) out.push({ kind: "text", text: text.slice(cursor) });
  return out;
}

/** Convenience wrapper: return the segmented view together with the unique
 *  misspellings (deduplicated by lowercase word, in first‑seen order) — this
 *  is what most callers need. */
export function checkSpelling(
  text: string,
  extraAllowed?: Iterable<string>
): { segments: SpellSegment[]; unique: SpellIssue[] } {
  const issues = findMisspellings(text, extraAllowed);
  const segments = segmentText(text, issues);
  const unique: SpellIssue[] = [];
  const seen = new Set<string>();
  for (const iss of issues) {
    const key = iss.word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(iss);
  }
  return { segments, unique };
}
