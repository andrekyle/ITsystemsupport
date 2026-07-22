export type Role = "Learner" | "Facilitator" | "Assessor" | "Moderator" | "Super User";

/** Staff roles see facilitation content (lesson plans, model answers) and the student list. */
export const STAFF_ROLES: readonly Role[] = ["Facilitator", "Assessor", "Moderator", "Super User"];
export const isStaff = (role: Role) => STAFF_ROLES.includes(role);

/* ---------- biographical enrolment information ---------- */

export const ENROL_TITLES = ["Prof", "Dr", "Mr", "Mrs", "Miss", "Ms"] as const;
export const ENROL_GENDERS = ["Male", "Female"] as const;
export const ENROL_EQUITY_GROUPS = ["African", "White", "Indian", "Coloured", "Asian"] as const;
export const ENROL_DISABILITIES = [
  "None",
  "Sight",
  "Hearing",
  "Communication",
  "Intellectual",
  "Emotional",
  "Physical",
  "Multiple",
] as const;
export const ENROL_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
] as const;
export const ENROL_LANGUAGES = [
  "Afrikaans",
  "English",
  "isiNdebele",
  "isiXhosa",
  "isiZulu",
  "Sepedi",
  "Sesotho",
  "Setswana",
  "siSwati",
  "Tshivenda",
  "Xitsonga",
  "South African Sign Language",
  "Other",
] as const;
export const ENROL_QUALIFICATIONS = [
  "No schooling",
  "Grade 9 or lower",
  "Grade 10 / N1",
  "Grade 11 / N2",
  "Grade 12 / Matric / N3",
  "National Certificate (NQF 4)",
  "National Certificate / Occupational Certificate (NQF 5)",
  "National Diploma (NQF 6)",
  "Bachelor's Degree / Advanced Diploma (NQF 7)",
  "Honours Degree / Postgraduate Diploma (NQF 8)",
  "Master's Degree (NQF 9)",
  "Doctoral Degree (NQF 10)",
] as const;
export const ENROL_SOCIOECONOMIC = [
  "Employed",
  "Self Employed",
  "Unemployed",
  "Learner / Student",
  "Pensioner",
  "Other",
] as const;

/** Biographical Enrolment Information Form — captured when a learner registers */
export interface EnrolmentInfo {
  title: string;
  firstNames: string;
  surname: string;
  maidenName: string;
  idNumber: string;
  age: string;
  gender: string;
  equityGroup: string;
  homeLanguage: string;
  disability: string;
  highestQualification: string;
  socioeconomicStatus: string;
  physicalAddress: string;
  physicalProvince: string;
  physicalPostalCode: string;
  postalAddress: string;
  postalProvince: string;
  postalPostalCode: string;
  telephone: string;
  cellphone: string;
  fax: string;
  email: string;
  employer: string;
  employerSdlNo: string;
  nextOfKinName: string;
  nextOfKinRelationship: string;
  nextOfKinPhone: string;
  /** typed full name serving as the signature */
  signature: string;
  /** ISO date the form was signed/last saved */
  signedDate: string;
}

export interface Profile {
  id: string;
  name: string;
  role: Role;
  createdAt: string;
  /** data-URL of the profile picture */
  avatar?: string;
  /** biographical enrolment information captured at registration */
  enrolment?: EnrolmentInfo;
  /** SHA-256 hex hash of the sign-in password (absent = no password set) */
  passwordHash?: string;
}

/** Stages each unit standard moves through */
export const UNIT_ACTIVITIES = [
  "Lesson & Training Aids",
  "Formative Assessment",
  "Summative Assessment",
  "POE Evidence",
] as const;

export type UnitActivity = (typeof UNIT_ACTIVITIES)[number];

export interface QuizAttempt {
  score: number;
  total: number;
  date: string;
}

/** An uploaded Portfolio of Evidence document */
export interface PoeDoc {
  name: string;
  type: string;
  size: number;
  /** data-URL of the file (local-only mode / legacy uploads) */
  data?: string;
  /** Supabase Storage path (cloud mode) */
  path?: string;
  uploadedAt: string;
}

export interface QuizResult {
  best: number;
  total: number;
  attempts: number;
  /** most recent attempts, newest first (max 3) */
  history?: QuizAttempt[];
}

/** Marked exercise summary — each key idea (point) is worth 2 marks; best of 2 attempts kept. */
export interface ExerciseResult {
  best: number;
  last: number;
  total: number;
  attempts: number;
}

export interface UnitProgress {
  /** activity name -> done */
  activities: Partial<Record<UnitActivity, boolean>>;
  quiz?: QuizResult;
  /** marked exercise scores (exercise id -> best-of-two result) */
  exercises?: Record<string, ExerciseResult>;
  /** editable logbook field values (field key -> value) */
  logbook?: Record<string, string | boolean>;
}

/* ---------- learning content ---------- */

export interface LessonSection {
  heading: string;
  icon: string;
  paragraphs: string[];
  bullets?: string[];
  /** data table rendered after the bullets (first column bolded) */
  table?: { headers: string[]; rows: string[][] };
  /** icon card grid rendered after the bullets */
  cards?: {
    icon: string;
    title: string;
    text: string;
    table?: { headers: string[]; rows: string[][] };
  }[];
  /** worked example shown in a highlighted card after the bullets */
  example?: { title: string; lines: string[] };
  /** facilitator/super-user only model answers shown at the bottom of the section */
  modelAnswer?: ModelAnswerBlock[];
  /** render as a plain always-visible section instead of a collapsible accordion */
  flat?: boolean;
}

export interface ModelAnswerBlock {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: { headers: string[]; rows: string[][]; caption?: string };
}

/** Semantic answer key for a typed exercise question. */
export interface ExerciseCheck {
  /** the correct answer, drawn from the lesson text, revealed once the learner's answer is judged correct */
  answer: string[];
  /** concept groups — a group is matched when any one of its phrases appears in the learner's answer */
  concepts: string[][];
  /** short human names for each key idea (index-aligned with concepts) — used in marker feedback */
  labels?: string[];
  /** how many concept groups must match for the answer to count as correct (default: half, rounded up) */
  min?: number;
}

export interface Exercise {
  id: string;
  title: string;
  task: string;
  steps: string[];
  /** per-question typed-answer blocks with semantic checking (index-aligned with steps) */
  checks?: ExerciseCheck[];
  download?: { filename: string; label: string; content: string; mime?: string };
  /** facilitator/super-user only model answer */
  modelAnswer?: ModelAnswerBlock[];
}

export interface Assignment {
  id: string;
  title: string;
  brief: string;
  requirements: string[];
  evidence: string;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export interface SaqaSection {
  heading: string;
  icon: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
}

export interface SaqaDetails {
  notice: string;
  registration: { label: string; value: string }[];
  sections: SaqaSection[];
}

export interface LogbookChecklistRow {
  text: string;
  /** [WP Learner Activity, WP Logbook Activity, WP Project, AS Learner Manual, AS Logbook Activity, AS Project] */
  marks: boolean[];
}

export interface LogbookSpec {
  assignmentTitle: string;
  programme: string;
  unitLabel: string;
  detailFields: string[];
  project: { time: string; title: string; text: string; resource: string };
  knowledgeQuestions: LogbookChecklistRow[];
  practicalActivities: LogbookChecklistRow[];
  workplaceActivities: string[];
  workplaceEvidenceNote: string;
  otherActivities: { activity: string; evidence: string }[];
  otherEvidenceNote: string;
  projectChecklist: { no: string; name: string }[];
}

export interface UnitNote {
  id: string;
  title: string;
  /** image path under /public, e.g. /notes/incident-report.png */
  image: string;
  caption?: string;
}

export interface LessonPlanRow {
  time?: string;
  title: string;
  /** renders as a highlighted break row */
  break?: boolean;
  /** plain paragraphs under the activity title */
  text?: string[];
  /** bulleted items under the activity title */
  bullets?: string[];
  resources?: string[];
}

export interface LessonPlanSection {
  heading?: string;
  /** restarts the schedule clock at this time, e.g. "09:00" — use for day 2 of a multi-day plan */
  startTime?: string;
  rows: LessonPlanRow[];
}

export interface LessonPlan {
  title: string;
  /** clock time the session starts, e.g. "09:00" — used to compute the schedule */
  startTime?: string;
  /** session details shown above the preparation notes */
  details?: { icon: string; label: string; value: string }[];
  /** preparation notes shown above the schedule */
  prep: string[];
  sections: LessonPlanSection[];
}

export interface UnitContent {
  lesson: LessonSection[];
  exercises: Exercise[];
  assignments: Assignment[];
  quiz: QuizQuestion[];
  saqa?: SaqaDetails;
  logbook?: LogbookSpec;
  notes?: UnitNote[];
  lessonPlan?: LessonPlan;
}

export interface ProgressState {
  /** unit standard id -> progress */
  units: Record<string, UnitProgress>;
  lastVisited?: string;
}

export interface UnitStandard {
  us: string;
  title: string;
  nqf: number;
  credits: number;
  dates: string;
  time: string;
}

export interface CourseModule {
  id: string;
  name: string;
  icon: string;
  /** number of formal learning activities in the module */
  activities: number;
  units: UnitStandard[];
}

export type PageId =
  | "dashboard"
  | "course"
  | "module"
  | "unit"
  | "assessments"
  | "deliverables"
  | "calendar"
  | "progress"
  | "poe"
  | "resources"
  | "profile"
  | "students"
  | "checklist"
  | "sectiond";

export interface Route {
  page: PageId;
  moduleId?: string;
  unitId?: string;
  /** profile id of the student being viewed on the students page */
  studentId?: string;
}
