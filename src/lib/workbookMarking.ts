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
