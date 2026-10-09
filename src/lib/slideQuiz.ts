import type { QuizQuestion } from "../types";
import { plainSlideText } from "./slideRichText";

const comparableQuizText = (text: string) =>
  plainSlideText(text).toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Repair generated title/topic questions whose saved answer index disagrees
 * with the slide itself. The displayed slide heading is authoritative. */
export function resolvedSlideQuizAnswer(question: QuizQuestion, slideHeading: string): number {
  const fallback = Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length
    ? question.answer
    : -1;
  if (!/\b(?:main\s+)?(?:topic|title|subject)\b/i.test(question.q)) return fallback;
  const heading = comparableQuizText(slideHeading);
  if (!heading) return fallback;
  const matches = question.options
    .map((option, index) => ({ index, text: comparableQuizText(option) }))
    .filter(option => option.text === heading);
  return matches.length === 1 ? matches[0].index : fallback;
}
