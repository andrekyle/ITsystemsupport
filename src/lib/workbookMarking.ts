/** Stable, non-sensitive fingerprint used to reuse a mark while the answer and
 * its exact rubric remain unchanged. This is not a security hash. */
export function workbookMarkFingerprint(answer: string, rubric: unknown): string {
  const source = `${answer.trim()}\n${JSON.stringify(rubric)}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${(hash >>> 0).toString(36)}:${source.length}`;
}

/** Learner guidance must not reuse AI feedback, which can contain memo answers. */
export function learnerWorkbookFeedback(result: {
  awarded: number;
  maxMarks: number;
  incorrectSegments?: readonly string[];
}): string {
  if (result.awarded >= result.maxMarks) {
    return "Well done. You have met all the marking requirements.";
  }
  const progress = result.awarded > 0
    ? "You have met some of the marking requirements, but your response needs more work."
    : "Your response has not yet earned marks. Revisit the question and the relevant lesson.";
  const guidance = result.incorrectSegments?.length
    ? "Review the parts of your answer marked as incorrect, check your understanding against the lesson, and revise them in your own words."
    : "Check that you have addressed every part of the question and supported your points with clear explanations in your own words.";
  return `${progress} ${guidance} You can edit your answer and submit it for marking again.`;
}
