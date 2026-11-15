import { VERIFIED_LEGACY_QUIZ_CONTEXT, VERIFIED_LEGACY_QUIZ_SOURCE_HASHES } from "../data/verifiedLegacyQuizContext";
import { recordLessonQuiz, type LessonQuizState, type SlideQuizDefinition } from "./lessonQuizProgress";

/** Read-only recovery using pinned definitions verified against repository history. */
export const hasVerifiedLegacyQuizContext = (unitId: string) => !!VERIFIED_LEGACY_QUIZ_CONTEXT[unitId];

export async function verifyLegacyQuizSource(unitId: string, rows: { key: string; value: string }[]): Promise<boolean> {
  if (!hasVerifiedLegacyQuizContext(unitId) || rows.some(row => row.key === `itss.unitbuilder.${unitId}.shared`)) return false;
  const edits = rows.find(row => row.key === `itss.lessonedits.${unitId}`);
  if (!edits) return false;
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(edits.value));
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, "0")).join("") === VERIFIED_LEGACY_QUIZ_SOURCE_HASHES[unitId];
}

export function recoverLegacyQuizContext(unitId: string, state: LessonQuizState, sourceConfirmed = false): LessonQuizState {
  if (!sourceConfirmed || state.identities) return state;
  const verified = VERIFIED_LEGACY_QUIZ_CONTEXT[unitId];
  if (!verified) return state;
  const recoveredSlides = Object.keys(verified).map(Number).filter(index => {
    const answers = state.answers[index];
    const questions = verified[index].questions;
    return Array.isArray(answers) && answers.length === questions.length && answers.some(answer => answer >= 0) &&
      answers.every((answer, qi) => Number.isInteger(answer) && answer >= -1 && answer < questions[qi].options.length);
  });
  if (!recoveredSlides.length) return state;
  const definitions: SlideQuizDefinition[] = Array.from({ length: Math.max(...recoveredSlides) + 1 }, (_, index) =>
    recoveredSlides.includes(index) ? verified[index] : { heading: "", questions: [] });
  return { ...recordLessonQuiz(state, definitions), recoveredSlides };
}
