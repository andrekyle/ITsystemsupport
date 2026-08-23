/**
 * Lightweight, in‑browser spell checker used to give students feedback on
 * their typed exercise answers.
 *
 * Strategy — high precision, low false‑positive rate:
 *   1. Maintain curated dictionaries: common + extended English, business /
 *      workplace vocabulary, and IT / hardware / software / networking
 *      terminology students are expected to use.
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
a about above accept access according account across acquire act action activate active add address advance
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
formal informal approval confidential channel escalation escalate
`;

/** Extended English dictionary — everyday vocabulary and irregular verb forms
 *  beyond the compact core list. */
const ENGLISH_EXTENDED = `
able absence absent absolutely accident accommodation accompany accurate accuracy achieve achievement
acknowledge activity actual actually adapt additional adequate adjust administer admire admission admit
adopt adult advantage adventure advertise advertisement advise adviser afford afraid agency agenda
aggressive agreement airport alarm alive allowance alternative amazing ambition ambitious ambulance
analysis ancient anger angle angry anniversary announce annual anxious apart apartment apologise apologize
apology apparent apparently appeal appearance appetite applicant application appointment appreciate
appreciation approximate approximately argument arrangement arrival arrow artificial asleep assessment
assistance assistant associate association assumption atmosphere attendance attention attitude attorney
attract attraction attractive audience aunt authority autumn average awake award aware awareness awful
awkward bachelor backwards baggage bake banana bandage barrier basket bathroom battery battle beach bean
bear beautiful beauty bedroom beginner beginning behalf belief believe belong beneath benefit beside
besides bicycle billion biology bird birthday biscuit bitter blanket blind boil bone bonus border boring
borrow boss bother bottle bottom boundary bowl brain branch brave bread breadth breakfast breath breathe
brick bridge brief briefly bright brilliant brother brown brush bubble bucket builder bulb bunch burden
burn bury bus bush busy butter button cabbage cabinet cable cake calculate calculation calendar calm
campaign campus candidate capable capacity capture carbon career careful carefully careless carpet
carriage carrot cassette castle casual category cattle ceiling celebrate celebration cement cemetery
central century ceremony certificate certain certainly chairman chalk champion championship channel
chapter charity cheap cheat cheese chemical chemistry cheque chest chicken chief child childhood chimney
chocolate church cigarette cinema circle circumstance citizen civilization classic classical
classification clerk clever climate climb clinic cloth clothes clothing cloud coach coal coast coat
coffee coin cold collapse collar colleague collection comfort comfortable comfortably comma commercial
commission commit commitment committee communicate communication companion comparison compete competition
competitive complaint completely complicated compliment compose composition compromise conclude concrete
conference confidence confident confirm confusion congratulate congratulations conjunction connection
conscience conscious consequence consequently conservative considerable consideration consistent
constitution construction consult consultant consumer contemporary continent continuous contrast
contribute contribution convenience convenient conversation convince cook cooker cool cooperate
cooperation corner corporation correction correctly correspond corridor cottage cotton cough council
counter county couple courage cousin coverage cow crack craft crash crazy cream creation creative
creature crew cricket crime criminal crisis criterion critic critical criticism crop crowd crowded
crucial cruel crystal cultural cup cupboard cure curious curriculum curtain curve cushion custom
cycle daily dairy dance danger dangerous dare dark darkness daughter dawn dead deadline deaf dear
debate debt decade December decent decorate decoration deed deeply defeat defence defend definite
definitely definition delay deliberate deliberately delicate delicious delight delivery democracy
democratic demonstrate demonstration dentist deny departure dependent deposit depression depth deputy
description desert deserve desirable desire desperate despite dessert destination destroy destruction
detailed detective determination determined devote diagram dialogue diamond diary dictionary diet
differ difficulty dig dinner diploma diplomat dirt dirty disadvantage disagree disappear disappoint
disappointment disaster discipline discount discovery discussion disease dish dismiss distance distant
distinguish distribute distribution district disturb divide division divorce doctor dog dollar
domestic dominant dominate donate donation dot doubt dozen draft drag drama dramatic drawer drawing
dream dress drink drug drum dry duck dust duty eager ear earn earnings earth earthquake ease east
eastern economic economics economy edge editor educate educational effective effectively efficiency
efficient effort egg elderly elect election electricity elegant elephant elevator eliminate elsewhere
embarrassed emergency emotion emotional emphasis emphasise emphasize empire employee employer employment
enable encounter encourage encouragement enemy engage engagement engine enormous enquiry enthusiasm
enthusiastic entrance entry envelope environmental equally equivalent era escape essay estate estimate
ethnic evaluate evaluation evening everybody everywhere evil evolution evolve exaggerate examination
excellent exception excite excitement exciting excuse executive exhibition existence expand expansion
expectation expense expensive explanation explode explosion expose exposure extension extensive extent
external extraordinary extreme extremely eye fabric facility factory faculty failure faith
fairly fall fame familiar famous fan fancy fantastic fare farm farmer fashion fashionable fat fault
favour favourite fear feather February federal fee feed feedback feel feeling fellow female fence
festival fever fiction fierce fifth fifty fight filing finally financial finding finger finish fire
firm firmly fisherman fitness fixed flame flash flavour flexible flight flood floor flour flow flower
flu fluid fly focus fold folk fond football forecast forehead foreign foreigner forest forever
forgive fork formation former formula fortnight fortunate fortunately fortune forum forward foundation
fountain fourth fox fragment frame freedom freeze frequency frequently fridge friendly friendship
frighten frog fruit frustrate fuel fun function fundamental funeral funny fur furniture gap garage
garden gas gate gender generally generate generation generous gentle gentleman gently genuine
geography gesture ghost giant gift girl glad glass global glory glove glue gold golden golf
goodbye goods gorgeous gossip grab grade gradually graduate grain grand grandfather grandmother
grant grass grateful grave gray grey great greatly greet greeting grocery gross guarantee
guard guess guest guilty guitar gun guy habit hair haircut hall hammer handle handsome
hardly harm harmful harvest hat hate hatred heading headline healthy heavily heavy heel height
hello helpful helpless hero hesitate highlight highly highway hill hint hip hire historian historic
historical hobby hole holiday hollow holy honest honesty honour hook horizon horn horrible horror
horse hospital hotel household housing huge humble humour hunger hungry hunt hunter hurry hurt
husband ice ideal identical identity ignore ill illegal illness illustrate illustration imagination
immediately immigrant immune implication imply importance impose impossible impress impression
impressive incident income incorporate incredible indeed independence independent indication individual
indoor industrial inevitable infection inflation influence inform ingredient inhabitant initial
initially initiative injure injury inner innocent insect insert insight insist inspect inspection
inspector inspiration inspire instant instantly instinct institution instrument insult insurance
intellectual intelligence intelligent intend intense intention interaction interested interesting
interior internal interpretation interrupt interval intervention introduction invent invention
investigate investigation invitation invite involve involvement iron island isolate isolation
jacket jail jam January jealous jeans jewellery joke journal journalist journey joy judgement
judgment juice July jump June jungle junior jury justice justify keen kettle kick kid kill
kilometre kindness king kingdom kiss kitchen knee knife knock knot ladder lady lake lamp land
landscape lane laugh laughter laundry lawyer layer lazy leaf league lean leap leather lecture
legal legend leisure lemon lend length lesson lever liberal liberty lid lie lifestyle lifetime
lift likely limitation lip liquid literary literature litter lively liver living loan lobby
logical lonely loose lord lorry loud loudly lounge lover loyal loyalty luck lucky luggage lunch
lung luxury mad magazine magic magnificent maid mail mainly maintenance majority male mall manner
manufacturer marble March margin marriage married marry mask mass massive master match mate
mathematics mature maximum mayor meal meanwhile meat mechanic mechanical mechanism medal medicine
membership memorial mental mentally merchant mercy mere merely mess metal metaphor metre midnight
mild mile military milk mill mineral minimum minister ministry minor minority miracle mirror
miserable misery mistake mixture mode moderate modest moment Monday monkey monster monthly monument
mood moon moral moreover mostly mother motion motivate motivation motor mountain mouth movement
movie mud mug multiply murder muscle museum mushroom musical musician mutual mystery nail naked
narrow nasty nation native naturally navy nearby nearly neat necessarily necessary neck needle negative
neglect neighbour neighbourhood neither nephew nerve nervous nest net neutral nevertheless newly
newspaper niece noble nobody nod noise noisy nonsense noon normally northern nose notebook
notion novel novelist nowadays nowhere nuclear nurse nut oak obey observation observe obstacle
occasion occasionally occupation occupy occur ocean o'clock October odd offence offend offensive
officer official officially onion onto opponent opportunity opposite opposition orange
ordinary organ organic origin original originally otherwise ought outcome outdoor outer outline
oven overall overcome overseas owe owl ownership ox oxygen pace pack packet pain painful paint
painter painting pair palace pale palm pan panel panic pants parallel parcel pardon parent park
parking parliament partial participant participate participation particularly partly passage
passenger passion passive passport patience pause pavement peak pen penalty pencil penny
perception perfect perfectly permanent permission permit personality personally persuade
petrol phase phenomenon philosophy photograph photographer phrase physically physician piano
pig pile pilot pin pink pipe pitch pity plain planet plant plastic plate platform pleasant
pleasure plenty plot pocket poem poet poetry poison pole political politician politics
pollution pond pool population porter portion portrait possess possession possibility possibly
postpone pot potato potential potentially pound pour poverty powder powerful praise pray prayer
precious precise precisely predict prediction preference pregnant preparation prescription
presence presentation preserve president press pressure presumably pretend pretty priest
primarily prime prince princess principal principle priority prison prisoner privacy prize
probable procedure proceed producer production profession professor profile profound
prohibit prominent promise promote promotion prompt pronunciation proof proper properly proportion
proposal propose prospect protect protection protest proud prove province provision psychological
psychology pub publication publish publisher pump punch punish punishment pupil purchase pure
purple pursue puzzle qualification qualify quantity quarter queen quit quotation quote rabbit
radical rail railway rain rare rarely rat ratio rational raw ray razor reaction
realistic reasonable rebuild recall recipe recognise recognition recognize recommend
reconstruction recover recovery recruit recruitment rediscover reduction redundant
reference regard regardless regional regret regular regularly reject relation relationship relative
relatively relax relaxed relevant relief religion religious reluctant rely remarkable remedy
remind remote removal rent repeatedly replacement representative reputation rescue resemble
reservation reserve resident resign resignation resist resistance resolve resort respect
respectively responsibility restaurant restrict restriction retain retire retirement retreat
reverse revise revision revolution reward rhythm rice rich rid ride ridiculous rival river
road roast rob robbery rock rocket rod roll romantic roof rope rose rough roughly routine
royal rubber rubbish rude ruin rural rush sack sad sadly safety sail sailor saint sake salad
salary salt sample sand sandwich satisfaction satisfactory satisfy Saturday sauce sausage
scandal scared scarcely scare scheme scholar scholarship scientific scientist scope score
scratch scream sea seal seat secondary secret secretary security seed seldom self sell
seminar senior sensible sensitive sentence September sequence series servant settlement severe
shade shadow shake shallow shame shape sharp shave sheep sheet shelf shell shelter shine
ship shirt shock shoe shoot shopping shore shortage shortly shoulder shout shower shut shy
sick sight signature significance significant significantly silence silent silly silver
similarly simply sin sincere sing singer sink sister situation sixth skill skilled skin
skirt sky slave sleep slice slight slightly slim slip slope smart smell smile smoke smooth
snake snow soap soccer socks soft software soil soldier sole solve somebody somehow someone
somewhat somewhere son song sorry soul soup southern spare speaker specialist species
spectacular spectrum spelling spider spirit spiritual spite splendid split spoon sport spot
spray spring square squeeze stable stadium staff stair stamp stare statement statistics
statue steady steal steam steel steep stick sticky stiff stomach stone storm
stranger strategic straw stream strength strengthen stress stretch strict strictly strike
string strip stroke struggle stupid subsequent substance substantial substitute suburb
succeed successful successfully suffer sufficient sugar suggestion suicide suit sum
Sunday sunlight sunny sunshine superb superior supermarket supper surely surface surgeon
surgery surprise surprisingly surround surroundings survey survival survive suspect suspicion
suspicious swallow swear sweater sweep sweet swim swing sword symbol sympathy symptom
tail tale talent talented tall tank tap tape target taste tax taxi tea tear tease
technique teenager telephone television temper temple temporary tendency tennis tension tent
territory terror terrible thankfully theatre theme theory thick thief thin thirst thorough
thoroughly thread threat threaten throat throughout thumb thunder Thursday ticket tide tidy
tie tight tiny tip tired tissue title tobacco toe toilet tomato ton tone tongue tonight
tooth topic torch tough tour tourism tourist towel tower toy trace tradition traditional
tragedy trail transform transformation transition transport trap tray treasure treatment
tremendous trend trick trousers truck truly trumpet trunk truth tube Tuesday tune tunnel
twin typical typically tyre ugly umbrella uncle uncomfortable underground unemployment
unexpected unfair unfortunately uniform unique universe unknown unlike unlikely unnecessary unpleasant
unusual upper upset upstairs urban urge urgent usage useful useless usually valley valuable
van variation variety vast vegetable vehicle venue verse vertical vessel victim victory
village violence violent virtually visible vision visitor vital vocabulary volume voluntary
volunteer vote wage waist wake wander warn warning wash waste wave weak weakness wealth
wealthy weapon wear weekly welfare western wet wheel whenever whereas wherever whisper
whistle widely widespread width wild wildlife willing wind wine wing winner winter wisdom
wise wish witness wonder wonderful wood wooden wool worry worse worship worst worth wound
wrap wrist yard yellow yield youth zero
`;

/** Business, workplace and commerce dictionary — vocabulary learners use when
 *  writing about organisations, money, HR and professional conduct. */
const BUSINESS_TERMS = `
accountability accountant accounting acquisition administration administrative administrator
advertise advertising agenda agreement allocate allocation apprentice apprenticeship appraisal
arbitration asset assets authorisation authorization bankrupt bankruptcy benchmark beneficiary
billing board bonus branding briefing broker bureaucracy businessman businesswoman buyer
capital cashier cashflow chairperson clause clientele collaborate collaboration colleague
commerce commercial commission commodity compensation competence competency competitor
complaint concession consortium consultancy consultant consumer contract contractor
corporate corporation costing courier credit creditor criteria debit debtor deduction
delegate delegation deliverable demand department depreciation deputy director directive
disciplinary dismissal dispatch dispute distributor dividend documentation economist
efficiency employ employee employer employment endorsement enterprise entrepreneur
entrepreneurship equity ethics etiquette evaluation executive expense export franchise
freelance freelancer funding goods governance grievance gross headquarters hierarchy
incentive induction industry inflation infrastructure innovation insurance intern internship
interview inventory invest investment investor invoice leadership ledger legislation
liability liaison litigation logistics losses management mandate manufacture manufacturer
manufacturing margin marketing mediation meeting memo memorandum mentor mentorship merger
milestone minutes mission monetary morale motivation negotiable negotiate negotiation
objective obligation onboarding operational organisational organizational orientation outsource
outsourcing overhead overtime paperwork partnership payment payroll payslip pension
performance personnel portfolio premises procurement productive productivity profession
professional professionalism profit profitable profitability projection promotion proposal
purchase quotation receipt receptionist recruitment redundancy remuneration requisition
resign resignation retail retailer retention revenue salary seminar shareholder shift
sponsor sponsorship stakeholder stationery statutory stipend stock strategy subordinate
subsidiary subsidy supervise supervision supervisor supplier surplus takeover tariff
taxation teamwork tender termination timesheet trademark transaction turnover vacancy
vendor venture verbal vocational voucher wages warehouse wholesale wholesaler workforce
workplace workshop
`;

/** Extended IT dictionary — development, networking, security and operations
 *  vocabulary beyond the core hardware/software list. */
const IT_EXTENDED = `
accessibility administrator agile analytics android antenna archive array attachment
authenticate authentication automation availability avatar backend backlog benchmark beta
botnet breach bugfix cabling capacitor captcha certificate charger chipset ciphertext
clipboard cluster codec compatibility component compress compression computing conditional
configuration connectivity connector console credential credentials cryptography cursor
dashboard datacentre datacenter debugging decode decompress deploy deployment deprecated developer
development dialog directory downgrade emulator encryption endpoint exploit extension fibre
fiber filename filesystem filter folder font footer formatting formula framework frontend
gateway gigabit hashing hashtag heatsink hostname hotfix hotspot implementation incognito
indexing installation installer integration iteration javascript kernel keylogger keyword
loader localhost macro maintenance metadata microchip middleware migration multitask
navigation notification overclock pairing partition patching permission pipeline playback
plaintext pointer popup preview production prototype provisioning quarantine recovery
refactor registry reinstall rendering repository requirement resistor responsive retrieval
rollback rollout sandbox scalability scam scammer schema screenshot scripting scroll scrum
sensor serial shareware silicon simulation sitemap slideshow snapshot socket spooler stack
staging subroutine subscription taskbar telemetry thermal thread throughput thumbnail
timeout timestamp toolbar topology transaction turnaround tutorial unicode uptime usability
validation vulnerability wallpaper warranty wearable webinar webpage whiteboard workflow
workload
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

/** Known acronyms (course + IT) — all‑caps tokens matching these are fine. */
const ACRONYMS = new Set(
  `SAQA NQF QCTO MICT SETA SETAS POE ITSS NCV POPIA GDPR COBIT ITIL SDLC HTTPS HTTP HTML XHTML
   PPTX DOCX XLSX JSON YAML EEPROM SDRAM NVME SODIMM CMOS BIOS RAID PCIE SATA WLAN VLAN
   BBBEE TCPIP SMTP IMAP DHCP VOIP IPSEC OAUTH SIEM MPLS ISCSI MYSQL MSSQL NOSQL PLSQL SQLITE
   HTTPD NGINX XAMPP ESKOM TELKOM VODACOM SANLAM NEDBANK CAPITEC UNISA NSFAS SASSA TRANSNET
   PRASA SANRAL DENEL INVESTEC`.split(/\s+/).filter(Boolean)
);

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

const BASE_DICT = new Set<string>([
  ...tokeniseDict(COMMON_ENGLISH),
  ...tokeniseDict(ENGLISH_EXTENDED),
  ...tokeniseDict(BUSINESS_TERMS),
  ...tokeniseDict(IT_TERMS),
  ...tokeniseDict(IT_EXTENDED),
]);

/** All dictionary words as an array, used to search for close matches. */
const DICT_ARRAY = Array.from(BASE_DICT);

/** Bigrams observed in the dictionary (base words + simple plurals). Unknown
 *  words containing several bigrams never seen here look like keyboard mash
 *  ("fisbhj") rather than a name or unusual term, and get flagged even though
 *  no close dictionary neighbour exists. */
const BIGRAMS = new Set<string>();
for (const w of DICT_ARRAY) {
  const f = w + "s"; // cheap plural: covers common word-final bigrams (hs, ds, …)
  for (let i = 0; i < f.length - 1; i++) BIGRAMS.add(f.slice(i, i + 2));
}

/** Does this unknown word look like random letters rather than a real word,
 *  name or acronym? Only 5+ letter words with at least {@link minUnseen}
 *  never-seen bigrams (or no vowels at all) are treated as gibberish. */
function looksLikeGibberish(word: string, minUnseen = 2): boolean {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length < 5) return false;
  let unseen = 0;
  for (let i = 0; i < w.length - 1; i++) {
    if (!BIGRAMS.has(w.slice(i, i + 2))) unseen++;
    if (unseen >= minUnseen) return true;
  }
  return !/[aeiouy]/.test(w);
}

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

/** Simple inflected forms of a dictionary base word, used so suggestions can
 *  match the learner's tense/number ("aquired" → "acquired", not "acquire"). */
function inflections(base: string): string[] {
  const out = [base];
  if (/[sxz]$|[sc]h$/.test(base)) out.push(base + "es");
  else if (/[bcdfghjklmnpqrstvwxz]y$/.test(base)) out.push(base.slice(0, -1) + "ies");
  else out.push(base + "s");
  out.push(base.endsWith("e") ? base + "d" : base + "ed");
  out.push(base.endsWith("e") ? base.slice(0, -1) + "ing" : base + "ing");
  return out;
}

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
  const consider = (sameInitialOnly: boolean) => {
    for (const cand of pool) {
      if (sameInitialOnly && cand[0] !== first) continue;
      if (NEVER_SUGGEST.has(cand)) continue;
      if (Math.abs(cand.length - w.length) > limit + 4) continue;
      for (const form of inflections(cand)) {
        if (Math.abs(form.length - w.length) > limit) continue;
        const d = editDistance(w, form, limit);
        if (d <= limit) scored.push({ word: form, d });
      }
    }
  };
  consider(true);
  // If no same‑initial candidates match, allow any initial (typo of the first letter).
  if (scored.length === 0) consider(false);
  // Typos usually preserve the start of the word, so on equal edit distance
  // prefer the candidate sharing the longest prefix with the input, then the
  // closest length.
  const prefixLen = (cand: string) => {
    let n = 0;
    while (n < cand.length && n < w.length && cand[n] === w[n]) n++;
    return n;
  };
  scored.sort(
    (a, b) =>
      a.d - b.d ||
      prefixLen(b.word) - prefixLen(a.word) ||
      Math.abs(a.word.length - w.length) - Math.abs(b.word.length - w.length) ||
      a.word.localeCompare(b.word)
  );
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
  // Contains digits or unusual punctuation → skip.
  if (/[^A-Za-z'-]/.test(word)) return false;
  // Mixed case in middle of the word (e.g. iPhone, YouTube) → brand, skip.
  if (/[a-z][A-Z]/.test(word)) return false;
  // ALL‑CAPS: 4‑letter tokens are plausible acronyms (BYOD, SDLC) and are
  // skipped; longer ones are checked further (known acronym vs gibberish).
  if (word === word.toUpperCase()) return word.length >= 5;
  // Any other word starting with a capital letter — sentence starter or
  // mid‑sentence — is treated as a possible proper noun (name, place, brand)
  // and skipped. The browser's built‑in spell checker still underlines these
  // live in the textarea so real typos aren't silently missed.
  if (/^[A-Z]/.test(word)) return false;
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

    const isAllCaps = tok.word === tok.word.toUpperCase();
    if (isAllCaps && ACRONYMS.has(tok.word)) continue;
    if (isKnown(tok.word, allowed)) continue;

    const key = tok.word.toLowerCase();
    let suggestions = suggestCache.get(key);
    if (!suggestions) {
      // Short words: only accept edit distance 1 to keep the flag conservative.
      const limit = tok.word.length <= 4 ? 1 : 2;
      suggestions = suggestFor(tok.word, limit, 3, allowed);
      suggestCache.set(key, suggestions);
    }

    if (isAllCaps) {
      // Unknown all-caps token: not a listed acronym and not a word. A single
      // never-seen letter pair marks it as keyboard mash ("QCTOHYT"); tokens
      // made of plausible English letter pairs (BYOD, NSFAS) are left alone.
      if (!looksLikeGibberish(tok.word, 1)) continue;
    } else if (suggestions.length === 0 && !looksLikeGibberish(tok.word)) {
      // Only report as misspelled if we found at least one plausible correction
      // or the word looks like random letters. Unknown words that are neither
      // (proper nouns, brand names, unusual technical terms, …) are left alone.
      continue;
    }

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
