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
  /** ISO timestamp of the most recent sign-in to this profile */
  lastLogin?: string;
  /** data-URL of the profile picture */
  avatar?: string;
  /** biographical enrolment information captured at registration */
  enrolment?: EnrolmentInfo;
  /** data-URL of the learner's handwritten signature (signed on white paper) */
  signatureImage?: string;
  /** the one-time signature upload request has been shown */
  signatureAsked?: boolean;
  /** salted PBKDF2 hash of the sign-in password (legacy profiles: SHA-256 hex; absent = no password set) */
  passwordHash?: string;
  /** role held before an automatic Super User promotion — restored on demotion */
  baseRole?: Role;
  /** ISO timestamp the learner completed the first-login onboarding tour */
  onboardedAt?: string;
  /** Supabase auth.users.id for this person — recorded when the admin
   *  provisions the account via Add User so chat can address them before
   *  they've signed in for the first time. */
  cloudUserId?: string;
  /** Filled-in Student Registration Form (paper-form replacement). */
  registrationForm?: RegistrationForm;
}

/** Complete Student Registration Form — mirrors the paper form used at
 *  learner intake. Persisted on `Profile.registrationForm` so staff can
 *  view / print a filled copy on any device. */
export interface RegistrationForm {
  /* Student information */
  title: string;
  gender: string;
  fullName: string;
  nickName: string;
  surname: string;
  maidenName: string;
  nationalId: string;
  dateOfBirth: string;
  emailAddress: string;
  contactNumber: string;
  ethnicGroup: string; // African | Indian | Coloured | Asian | White
  maritalStatus: string;
  dependants: string;
  employmentStatusYesNo: string; // "yes" | "no"
  idType: string; // Passport No | Driver's License | Temp ID No | ID Number
  physicalAddress: string;
  postalAddress: string;
  addressCode: string;
  postalCode: string;
  /* Passport / alternative ID (kept for backwards-compat with earlier builds) */
  passportNumber: string;
  passportCountry: string;
  passportExpiry: string;
  /* Nationality (single-select from the matrix on page 1) */
  nationality: string;
  ethnicRegion: string;
  /* Home language */
  homeLanguage: string;
  /* Disability status — Communication / Emotional / Hearing / Intellectual /
   *  Physical / Multiple / Unspecified / None. `disabilityStatus` is the
   *  single selected radio choice; the individual boolean fields are kept
   *  for compat but no longer used by the paper-form layout. */
  disabilityStatus: string;
  disabilityPhysical: boolean;
  disabilityHearing: boolean;
  disabilityIntellectual: boolean;
  disabilityVisual: boolean;
  /* Educational Status */
  lastSchoolAttended: string;
  highestGradeCompleted: string;
  schoolDistrict: string;
  yearAchievedSchool: string;
  highestQualification: string;
  yearAchievedQualification: string;
  institution: string;
  awards: string;
  yearCompleted: string;
  /* Employment Details */
  company: string;
  jobTitle: string;
  learnership: string;
  startDate: string;
  employmentStatus: string;
  industry: string;
  employerContactNumber: string;
  /* Alternative Contact Details (next of kin) */
  altContactName: string;
  altContactNumber: string;
  altContactRelationship: string;
  altContactEmail: string;
  /* Qualification / Course Enrolment */
  qualificationTitle: string;
  nqfLevel: string;
  saqaId: string;
  credits: string;
  courseCode: string;
  notionalHours: string;
  registrationDate: string;
  enrolmentDate: string;
  /* Alias kept for legacy code paths */
  qualificationCourseNumber: string;
  employerName: string;
  employerAddress: string;
  employerRelationship: string;
  /* Signature block */
  signedAt: string;
  learnerSignature: string;
  learnerSignatureDate: string;
  studentNumber: string;
  /* Administration and Document Control */
  docIdPassport: boolean;
  docHighestCert: boolean;
  docProofResidence: boolean;
  docCvProfile: boolean;
  verifiedBy: string;
  verificationDate: string;
  entryReqMeets: boolean;
  entryReqDoesntMeet: boolean;
  entryReqBridging: boolean;
  entryReqOther: string;
  admitStudent: boolean;
  doNotAdmit: boolean;
  requiresAdditionalDocs: boolean;
  authorisedByName: string;
  authorisedByDate: string;
  /* Legacy admin picks — kept for backwards-compat with earlier builds */
  admissionDecision: "" | "admit" | "not-admit";
  meetsEntryRequirements: "" | "yes" | "no";
  requiresBridging: boolean;
  /* ISO timestamp of the last save */
  savedAt: string;
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

/** Marked exercise summary — each key idea (point) is worth 2 marks; best of 3 attempts kept. */
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
  /** results for titled quizzes (quiz id -> result) */
  quizzes?: Record<string, QuizResult>;
  /** marked exercise scores (exercise id -> best-of-attempts result) */
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
  /** image figure slots rendered after the content — staff upload the pictures, learners see placeholders until then */
  figures?: LessonFigure[];
  /** facilitator/super-user only model answers shown at the bottom of the section */
  modelAnswer?: ModelAnswerBlock[];
  /** render as a plain always-visible section instead of a collapsible accordion */
  flat?: boolean;
  /** when true, replace the section body with the lesson's final quiz and gate lesson completion on all-correct */
  quizGate?: boolean;
  /** per-slide gate quiz — learner must answer every question correctly before Next is unlocked */
  slideQuiz?: QuizQuestion[];
}

/** An image slot in a lesson section. The picture itself is uploaded by staff and shared to all devices. */
export interface LessonFigure {
  /** stable id the uploaded image is stored under, e.g. "ada-lovelace" */
  id: string;
  /** caption shown under the image (or inside the placeholder) */
  caption: string;
  /** staff-only note describing what picture to upload */
  hint?: string;
  /** presenter-mode narration: short bullet points shown alongside the slide image */
  bullets?: string[];
  /** presenter-mode narration: a single short paragraph shown alongside the slide image (used if bullets is empty) */
  note?: string;
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
  /** scenario / instruction paragraphs shown above the questions */
  scenario?: string[];
  steps: string[];
  /** per-question typed-answer blocks with semantic checking (index-aligned with steps) */
  checks?: ExerciseCheck[];
  /** ideal answers for the scenario task — revealed by a super-user-only button */
  idealAnswer?: ModelAnswerBlock[];
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
  /** Question kind. Omitted / "choice" = single or multi-select (multi if `answers` present). */
  kind?: "choice" | "order" | "match";
  /** Choice options (choice questions only). */
  options: string[];
  /** Correct single-choice answer index. */
  answer: number;
  /** When present, the question is select-all-that-apply and these indices are the correct set. */
  answers?: number[];
  /** Order-question items in the CORRECT order (shuffled at render). */
  items?: string[];
  /** Match-question pairs: left↔right in the CORRECT pairing (rights shuffled at render). */
  pairs?: { left: string; right: string }[];
  /** Optional inline SVG markup shown above the question (used by e.g. analogy diagrams). */
  imageSvg?: string;
  explain: string;
}

/** A titled quiz — units may carry several (rendered as a chooser on the Quiz tab). */
export interface NamedQuiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
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
  /** multiple titled quizzes — shown as a chooser on the Quiz tab */
  quizzes?: NamedQuiz[];
  saqa?: SaqaDetails;
  logbook?: LogbookSpec;
  notes?: UnitNote[];
  lessonPlan?: LessonPlan;
  /** question sessions shown on their own tab (rendered like exercises) */
  questionSessions?: Exercise[];
  /** end-of-unit self assessment checklist — rendered on its own tab with tickable boxes */
  selfAssessment?: SelfAssessment;
}

/** End-of-unit self assessment: learner ticks each statement they feel competent in. */
export interface SelfAssessment {
  /** intro shown above the checklist */
  intro: string[];
  /** the tickable statements */
  items: string[];
  /** guidance shown below the checklist */
  outro: string[];
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
  | "sectiond"
  | "attendance"
  | "compliance"
  | "analytics"
  | "chat"
  | "community"
  | "forms";

export interface Route {
  page: PageId;
  moduleId?: string;
  unitId?: string;
  /** profile id of the student being viewed on the students page */
  studentId?: string;
}
