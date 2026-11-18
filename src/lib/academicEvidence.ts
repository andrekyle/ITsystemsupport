import { courseScopedKey } from "./courseScope";
import type { ProgressState, UnitProgress, WorkbookSpec } from "../types";
import { parseLessonQuizState, type LessonQuizState, type SlideQuizDefinition } from "./lessonQuizProgress";
import { plainSlideText } from "./slideRichText";

export type LessonQuizEvidence = Record<string, LessonQuizState[]>;
export interface SavedAnswer { key: string; question: string; answer: string; mark?: { awarded: number; maxMarks: number; feedback: string } }
export interface SavedLessonAnswer { key: string; heading: string; question: string; answer: string; legacy?: boolean; options?: string[]; correctAnswer?: string; explanation?: string }
export interface SavedLessonQuizResult {
  key: string; title: string; completed: boolean; total: number;
  attempts?: number; answers: SavedLessonAnswer[];
}

/** Read completion flags and the answer key saved with that exact quiz version. */
export function savedLessonQuizResults(states: LessonQuizState[] = [], slides: SlideQuizDefinition[] = []): SavedLessonQuizResult[] {
  const results = new Map<string, SavedLessonQuizResult>();
  for (const state of states) {
    const answers = new Map(savedLessonAnswers([state]).map(answer => [answer.key, answer]));
    const savedOrder = new Map([...answers.keys()].map((key, index) => [key, index]));
    const versions = Object.entries(state.identities?.versions ?? {});
    for (const [key, version] of versions) {
      try {
        const entries: unknown = JSON.parse(key);
        if (!Array.isArray(entries) || !entries.length) continue;
        const questions = entries.map(entry => JSON.parse(entry) as [string, string]);
        if (questions.some(pair => !Array.isArray(pair) || pair.length !== 2 || pair.some(value => typeof value !== "string"))) continue;
        const validOrder = (order: unknown, count: number): order is number[] => Array.isArray(order) && order.length === count && new Set(order).size === count && order.every(index => Number.isInteger(index) && index >= 0 && index < count);
        const questionOrder = validOrder(version.questionOrder, questions.length) ? version.questionOrder : undefined;
        const selected = questions.map(([question, correct], sortedIndex) => {
          const answer = answers.get(question);
          if (!answer) return undefined;
          const [identity] = JSON.parse(question);
          const [heading, occurrence, text, , options] = JSON.parse(identity);
          if (!Array.isArray(options) || options.some(option => typeof option !== "string")) return undefined;
          const source = slides.filter(slide => plainSlideText(slide.heading).trim() === plainSlideText(heading).trim())[occurrence];
          const authored = source?.questions.find(item => item.q === text && JSON.stringify([...item.options].sort()) === JSON.stringify(options));
          const position = questionOrder?.indexOf(sortedIndex) ?? -1;
          const optionOrder = position >= 0 ? version.optionOrders?.[position] : undefined;
          const orderedOptions = validOrder(optionOrder, options.length) ? optionOrder.map(index => options[index]) : authored?.options ?? options;
          return { ...answer, options: orderedOptions.map((option: string) => plainSlideText(option).trim()),
            correctAnswer: plainSlideText(correct).trim(),
            explanation: authored?.explain ? plainSlideText(authored.explain).trim() : undefined,
            order: position >= 0 ? position : authored ? source.questions.indexOf(authored) : savedOrder.get(question) ?? Number.MAX_SAFE_INTEGER };
        });
        if (!selected.some(Boolean)) continue;
        const complete = version.checked === true && selected.every(Boolean);
        results.set(key, { key, title: selected.find(Boolean)!.heading, completed: complete,
          total: questions.length, attempts: version.attempts > 0 ? version.attempts : undefined,
          answers: selected.filter(answer => !!answer).sort((a, b) => a!.order - b!.order).map(answer => { const { order, ...display } = answer!; return display; }) });
      } catch { /* Do not infer completion for an unreadable quiz version. */ }
    }
    if (versions.length && !state.recoveredSlides) continue;
    for (const [slide, picks] of Object.entries(state.answers ?? {})) {
      if (state.recoveredSlides?.includes(Number(slide))) continue;
      if (!Array.isArray(picks) || !picks.some(pick => Number.isInteger(pick) && pick >= 0)) continue;
      const key = `legacy.${slide}`;
      results.set(key, { key, title: `Slide ${Number(slide) + 1}`, completed: state.checked[Number(slide)] === true && picks.every(pick => Number.isInteger(pick) && pick >= 0),
        total: picks.length, attempts: state.attempts[Number(slide)] > 0 ? state.attempts[Number(slide)] : undefined,
        answers: [...answers.values()].filter(answer => answer.key.startsWith(`${key}.`)) });
    }
  }
  return [...results.values()];
}

const label = (key: string) => key.replace(/[._-]+/g, " ").replace(/^./, c => c.toUpperCase());
function savedMark(raw: unknown): SavedAnswer["mark"] {
  try {
    const mark = JSON.parse(String(raw ?? ""));
    if (Number.isFinite(mark?.awarded) && Number.isFinite(mark?.maxMarks)) {
      return { awarded: mark.awarded, maxMarks: mark.maxMarks, feedback: typeof mark.feedback === "string" ? mark.feedback : "" };
    }
  } catch { /* An answer remains visible even when its mark is unavailable. */ }
}

/** Read actual answer fields, excluding workbook covers, identity details and AI metadata. */
export function savedWorkbookAnswers(unit: UnitProgress | undefined, workbook?: WorkbookSpec): SavedAnswer[] {
  const values = unit?.logbook ?? {};
  const definitions = workbook?.outcomes.flatMap(outcome => outcome.questions.map(question => ({ outcome, question }))) ?? [];
  return Object.entries(values).flatMap(([key, value]) => {
    if (typeof value !== "string" || !value.trim()) return [];
    const template = key.match(/^learner-workbook\.(.+)\.answer$/);
    const generated = key.match(/^built-workbook\.([^.]+)\.([^.]+)$/);
    if (!template && (!generated || /^(source|cover|mark|task-mark)$/.test(generated[1]))) return [];
    const id = template?.[1] ?? `${generated![1]}.${generated![2]}`;
    const questionId = id.split(".").slice(-1)[0];
    const definition = definitions.find(entry => `${entry.outcome.id}.${entry.question.id}` === id);
    const mark = savedMark(values[`learner-workbook.task-mark.${questionId}`]) ??
      savedMark(values[`built-workbook.task-mark.${id}`]) ??
      // Legacy generated workbooks stored one result for a single-question outcome.
      (generated && (definition?.outcome.questions.length === 1 || Object.keys(values).filter(k => k.startsWith(`built-workbook.${generated[1]}.`)).length === 1)
        ? savedMark(values[`built-workbook.mark.${generated[1]}`]) : undefined);
    return [{ key, question: definition ? `Activity ${definition.question.task}: ${definition.question.text}` : label(id), answer: value, mark }];
  });
}

/** Only recorded marks count as assessed work; a saved draft is still visible separately. */
export function savedWorkbookResults(unit: UnitProgress | undefined): { best: number; total: number }[] {
  return savedWorkbookAnswers(unit).flatMap(({ mark }) => mark && mark.maxMarks > 0 && mark.awarded >= 0 && mark.awarded <= mark.maxMarks
    ? [{ best: mark.awarded, total: mark.maxMarks }] : []);
}

export function hasFormativeEvidence(unit: UnitProgress | undefined): boolean {
  return !!unit && (!!(unit.quiz && unit.quiz.total > 0) ||
    Object.values(unit.quizzes ?? {}).some(result => result.total > 0) ||
    Object.values(unit.exercises ?? {}).some(result => result.total > 0) || savedWorkbookResults(unit).length > 0);
}

/** A missing result is not proof that the learner never attempted an activity. */
export function hasSavedQuizPicks(picks: unknown): boolean {
  try {
    const entries = typeof picks === "string" ? JSON.parse(picks) : picks;
    if (entries && typeof entries === "object" && Object.values(entries).some((entry: any) =>
      entry && (Object.values(entry.picks ?? {}).some(value => Number.isInteger(value) && Number(value) >= 0) ||
        (Array.isArray(entry.order) && entry.order.length > 0)))) return true;
  } catch { /* An unavailable snapshot cannot establish that no attempt occurred. */ }
  return false;
}

export function quizEvidenceLabel(result: { best: number; total: number } | undefined, picks: unknown, loading = false): string {
  if (result && result.total > 0) return `${result.best}/${result.total} · ${Math.round(result.best / result.total * 100)}%`;
  if (loading) return "Checking saved records…";
  return hasSavedQuizPicks(picks) ? "Answers saved · score unavailable" : "No saved result linked to this quiz";
}

/** Identity saves contain original question/option text, so changed slides cannot mislabel answers. */
export function savedLessonAnswers(states: LessonQuizState[] = []): SavedLessonAnswer[] {
  const answers = new Map<string, SavedLessonAnswer>();
  for (const state of states) {
    const identities = Object.entries(state.identities?.picks ?? {});
    for (const [key, answer] of identities) {
      try {
        const [identity] = JSON.parse(key);
        const [heading, , question, , options] = JSON.parse(identity);
        if (typeof heading === "string" && typeof question === "string" && typeof answer === "string") {
          answers.set(key, { key, heading: plainSlideText(heading).trim(), question: plainSlideText(question).trim(), answer: plainSlideText(answer).trim(),
            options: Array.isArray(options) && options.every(option => typeof option === "string") ? options.map(option => plainSlideText(option).trim()) : undefined });
        }
      } catch { /* Never guess the question text for a damaged identity. */ }
    }
    if (identities.length && !state.recoveredSlides) continue;
    for (const [slide, picks] of Object.entries(state.answers ?? {})) {
      if (state.recoveredSlides?.includes(Number(slide))) continue;
      if (!Array.isArray(picks)) continue;
      picks.forEach((pick, index) => {
        if (!Number.isInteger(pick) || pick < 0) return;
        const key = `legacy.${slide}.${index}`;
        answers.set(key, { key, heading: `Slide ${Number(slide) + 1}`, question: `Question ${index + 1}`, answer: `Saved option ${pick + 1}`, legacy: true });
      });
    }
  }
  return [...answers.values()];
}

export function localLessonQuizEvidence(profileIds: Iterable<string>): LessonQuizEvidence {
  const evidence: LessonQuizEvidence = {};
  const prefixes = [...profileIds].map(id => courseScopedKey(`itss.lessonquiz.${id}.`));
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    const prefix = prefixes.find(value => key.startsWith(value));
    if (!prefix) continue;
    try {
      const unitId = key.slice(prefix.length);
      (evidence[unitId] ??= []).push(parseLessonQuizState(localStorage.getItem(key)!));
    } catch { /* Leave damaged source records intact. */ }
  }
  return evidence;
}

export function combineLessonQuizEvidence(...sources: LessonQuizEvidence[]): LessonQuizEvidence {
  const result: LessonQuizEvidence = {};
  for (const source of sources) for (const [unit, states] of Object.entries(source)) (result[unit] ??= []).push(...states);
  return result;
}

export function hasSavedAcademicWork(progress: ProgressState, lessons: LessonQuizEvidence = {}): boolean {
  return Object.values(progress.units).some(unit => savedWorkbookAnswers(unit).length || unit.quiz ||
    Object.keys(unit.quizzes ?? {}).length || Object.keys(unit.exercises ?? {}).length ||
    Object.entries(unit.logbook ?? {}).some(([key, value]) => /^exq\..+\.\d+$/.test(key) && typeof value === "string" && value.trim())) ||
    Object.values(lessons).some(states => savedLessonAnswers(states).length);
}

const escape = (value: unknown) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export function savedAcademicWorkHtml(unit: UnitProgress | undefined, workbook: WorkbookSpec | undefined, lessons: LessonQuizState[] = []): string {
  const workbookAnswers = savedWorkbookAnswers(unit, workbook);
  const lessonAnswers = savedLessonAnswers(lessons);
  const lessonResults = savedLessonQuizResults(lessons);
  const readableLessons = lessonAnswers.filter(answer => !answer.legacy);
  const unavailableLessons = lessonAnswers.filter(answer => answer.legacy);
  const quizzes = [...(unit?.quiz ? [["Knowledge check", unit.quiz] as const] : []), ...Object.entries(unit?.quizzes ?? {})];
  return [
    ...lessonResults.map(result => `<p class="marks">Lesson quiz — ${escape(result.title)}: <strong>${result.completed ? "Completed" : "In progress"}</strong> — score not recorded.</p>`),
    ...workbookAnswers.map(row => `<div class="exercise"><h3>${escape(row.question)}</h3><div class="answer">${escape(row.answer)}</div>${row.mark ? `<p class="marks">Saved mark: ${row.mark.awarded}/${row.mark.maxMarks} — ${escape(row.mark.feedback)}</p>` : "<p class=\"marks\">Saved answer; no mark recorded.</p>"}</div>`),
    ...(readableLessons.length ? ["<h3>Saved lesson-quiz answers</h3>", ...readableLessons.map(row => `<div class="q"><p class="marks">${escape(row.heading)}</p><div class="q-text">${escape(row.question)}</div><div class="answer">${escape(row.answer)}</div></div>`)] : []),
    ...(unavailableLessons.length ? [`<p class="marks">Answer text unavailable for ${unavailableLessons.length} archived selections. The original question and option text must be recovered before these selections can be reviewed. Saved completion records are retained.</p>`] : []),
    ...quizzes.map(([id, result]) => `<div class="exercise"><h3>Saved quiz result — ${escape(id)}</h3><p class="marks">Best ${escape(result.best)}/${escape(result.total)}; ${escape(result.attempts)} attempt(s).</p></div>`),
  ].join("\n");
}
