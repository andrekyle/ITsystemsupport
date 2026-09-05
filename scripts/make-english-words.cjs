// Regenerates src/data/englishWords.ts for the in-browser spell checker.
//
// Usage:
//   1. Download the two source lists into %TEMP%/words (or /tmp/words):
//        curl -L -o count_1w.txt   https://norvig.com/ngrams/count_1w.txt
//        curl -L -o words_alpha.txt https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt
//   2. node scripts/make-english-words.cjs   (from the repo root)
//
// Keeps the most frequent real English words (Norvig frequency order ∩ dwyl
// dictionary), adds British/South African spelling variants beside their
// American forms, and drops apostrophe-less contraction junk and notorious
// typos that leak through the dwyl list.
const fs = require("fs");
const os = require("os");
const path = require("path");

const tmp = path.join(os.tmpdir(), "words");
const counts = fs.readFileSync(path.join(tmp, "count_1w.txt"), "utf8");
const alpha = fs.readFileSync(path.join(tmp, "words_alpha.txt"), "utf8");

const real = new Set(alpha.split(/\r?\n/).map((w) => w.trim()).filter(Boolean));
console.log("dwyl dictionary words:", real.size);

// Apostrophe-less contraction junk that pollutes suggestions ("did you mean
// dont?") — the checker recognises real contractions separately.
const EXCLUDE = new Set(
  ("dont wont cant isnt arent doesnt didnt wasnt werent hasnt havent hadnt shouldnt wouldnt " +
    "couldnt mustnt neednt youre youve youll youd theyre theyve theyll theyd weve ive hes shes " +
    "thats whos whats theres heres arent aint gonna wanna gotta " +
    // classic typos that leak through the dwyl list
    "occured occuring untill tommorow tommorrow wich thier recieve recieved recieves recieving " +
    "beleive beleived beleives seperate seperated seperates seperately definately accomodate " +
    "accomodation embarass embarassed occassion occassional occassionally publically recomend " +
    "recomended refered targetted truely arguement acheive acheived alot enviroment enviromental " +
    "goverment managment commitee committe existance persistant independant relevent apparant " +
    "neccessary neccesary occurance performence begining beggining sucess sucessful sucessfully").split(/\s+/)
);

// British/South African variants of an American-spelled word. Only variants
// that exist in the dwyl dictionary are emitted, so no junk is invented.
function britishVariants(w) {
  const out = [];
  const sub = (re, rep) => {
    if (re.test(w)) out.push(w.replace(re, rep));
  };
  sub(/ization(s?)$/, "isation$1");
  sub(/izing$/, "ising");
  sub(/ized$/, "ised");
  sub(/izer(s?)$/, "iser$1");
  sub(/ize(s?)$/, "ise$1");
  sub(/yze(s?)$/, "yse$1");
  sub(/yzing$/, "ysing");
  sub(/yzed$/, "ysed");
  sub(/or(s?)$/, "our$1"); // color→colour, behaviors→behaviours
  sub(/er(s?)$/, "re$1"); // center→centre, liters→litres
  sub(/og(s?)$/, "ogue$1"); // dialog→dialogue
  sub(/ense(s?)$/, "ence$1"); // license→licence
  sub(/eled$/, "elled");
  sub(/eling$/, "elling");
  sub(/eler(s?)$/, "eller$1");
  sub(/ll$/, "l"); // enroll→enrol, fulfill→fulfil
  sub(/llment(s?)$/, "lment$1");
  return out.filter((v) => v !== w && real.has(v));
}

const TOP = 60000; // scan this many Norvig rows (frequency-sorted)
const out = [];
const seen = new Set();
let scanned = 0;
for (const line of counts.split(/\r?\n/)) {
  if (scanned >= TOP) break;
  const word = line.split("\t")[0];
  if (!word) continue;
  scanned++;
  if (word.length < 2 || word.length > 24) continue;
  if (!/^[a-z]+$/.test(word)) continue;
  if (!real.has(word)) continue; // drops web typos ("teh"), slang, codes
  if (EXCLUDE.has(word)) continue;
  if (seen.has(word)) continue;
  seen.add(word);
  out.push(word);
  // emit the British spelling right after, so it shares the frequency rank
  for (const v of britishVariants(word)) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
}
console.log("kept words:", out.length);

// wrap to ~100-char lines to keep the TS file diff-able
const lines = [];
let cur = [];
let len = 0;
for (const w of out) {
  if (len + w.length + 1 > 100) {
    lines.push(cur.join(" "));
    cur = [];
    len = 0;
  }
  cur.push(w);
  len += w.length + 1;
}
if (cur.length) lines.push(cur.join(" "));

const ts = `/**
 * English dictionary for the in-browser spell checker: the ${out.length.toLocaleString(
   "en-US"
 )} most
 * frequent English words, most frequent first.
 *
 * Built from two freely licensed word lists:
 *   - norvig.com/ngrams/count_1w.txt — word frequencies from the Google
 *     Web Trillion Word Corpus (compiled by Peter Norvig, free to use)
 *   - github.com/dwyl/english-words words_alpha.txt (Unlicense) — used to
 *     keep only real dictionary words, dropping web typos and codes
 *
 * British/South African spellings (-ise, -isation, -our, -re, -ogue, -ence,
 * -elled, -ll/-l) are emitted next to their American forms so both are
 * accepted and rank equally as suggestions.
 *
 * Regenerate by intersecting the two lists in frequency order (see the
 * spellcheck module for how rank is used to sort suggestions).
 */
export const ENGLISH_WORDS = \`
${lines.join("\n")}
\`;
`;
fs.writeFileSync("src/data/englishWords.ts", ts);
console.log("wrote src/data/englishWords.ts,", (ts.length / 1024).toFixed(0), "KB");
