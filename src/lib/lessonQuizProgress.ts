import type { QuizQuestion } from "../types";
import { resolvedSlideQuizAnswer } from "./slideQuiz";

interface QuizRecords {
  answers: Record<number, number[]>;
  checked: Record<number, boolean>;
  attempts: Record<number, number>;
}

export interface LessonQuizState extends QuizRecords {
  identities?: {
    picks: Record<string, string>;
    versions: Record<string, { checked: boolean; attempts: number }>;
  };
  legacy?: QuizRecords;
}

export interface SlideQuizDefinition {
  heading: string;
  questions: QuizQuestion[];
}

export function parseLessonQuizState(value: string): LessonQuizState {
  const parsed = JSON.parse(value) as LessonQuizState;
  const isRecord = (record: unknown) => !!record && typeof record === "object" && !Array.isArray(record);
  if (!isRecord(parsed) ||
      [parsed.answers, parsed.checked, parsed.attempts].some(record => record !== undefined && !isRecord(record)) ||
      (parsed.identities !== undefined && (!isRecord(parsed.identities) ||
        !isRecord(parsed.identities.picks) || !isRecord(parsed.identities.versions)))) {
    throw new Error("The saved lesson quiz has an invalid format. Keep this browser's storage and contact staff.");
  }
  return { ...parsed, answers: parsed.answers ?? {}, checked: parsed.checked ?? {}, attempts: parsed.attempts ?? {} };
}

function questionKeys(slides: SlideQuizDefinition[], si: number): string[] {
  const slide = slides[si];
  const occurrence = slides.slice(0, si).filter(previous => previous.heading === slide.heading).length;
  const seen = new Map<string, number>();
  return slide.questions.map(question => {
    const identity = JSON.stringify([slide.heading, occurrence, question.q, question.imageSvg ?? "", [...question.options].sort()]);
    const duplicate = seen.get(identity) ?? 0;
    seen.set(identity, duplicate + 1);
    return JSON.stringify([identity, duplicate]);
  });
}

function versionKey(slide: SlideQuizDefinition, keys: string[]): string {
  return JSON.stringify(slide.questions.map((question, qi) =>
    JSON.stringify([keys[qi], question.options[resolvedSlideQuizAnswer(question, slide.heading)]])).sort());
}

/** Retain picks for removed questions too, so restoring a quiz can restore its work. */
export function recordLessonQuiz(state: LessonQuizState, slides: SlideQuizDefinition[]): LessonQuizState {
  const picks = { ...state.identities?.picks };
  const versions = { ...state.identities?.versions };
  slides.forEach((slide, si) => {
    if (!slide.questions.length) return;
    const keys = questionKeys(slides, si);
    slide.questions.forEach((question, qi) => {
      const option = question.options[state.answers[si]?.[qi] ?? -1];
      if (option !== undefined) picks[keys[qi]] = option;
    });
    versions[versionKey(slide, keys)] = { checked: !!state.checked[si], attempts: state.attempts[si] ?? 0 };
  });
  return { ...state, identities: { picks, versions } };
}

/** Upgrade positional saves without guessing answers for new or changed questions. */
export function reconcileLessonQuiz(state: LessonQuizState, slides: SlideQuizDefinition[]): LessonQuizState {
  if (!slides.length || (!state.identities && !slides.some(slide => slide.questions.length))) return state;
  if (!state.identities) {
    return recordLessonQuiz({
      ...state,
      legacy: { answers: state.answers, checked: state.checked, attempts: state.attempts },
    }, slides);
  }
  const answers = { ...state.answers };
  const checked = { ...state.checked };
  const attempts = { ...state.attempts };
  slides.forEach((slide, si) => {
    const keys = questionKeys(slides, si);
    answers[si] = slide.questions.map((question, qi) => {
      const selected = state.identities?.picks[keys[qi]];
      const matches = question.options.flatMap((option, oi) => option === selected ? [oi] : []);
      return matches.length === 1 ? matches[0] : -1;
    });
    const version = state.identities?.versions[versionKey(slide, keys)];
    checked[si] = version?.checked ?? false;
    attempts[si] = version?.attempts ?? 0;
  });
  return { ...state, answers, checked, attempts };
}
