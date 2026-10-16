import type { LessonEdits } from "../store";

export function lessonEditsAfterSplit(edits: LessonEdits, si: number, addedFigureIds: string[]): LessonEdits {
  const shift = (index: number) => index > si ? index + 1 : index;
  const numbered = <T,>(values: Record<number, T> | undefined): Record<number, T> | undefined =>
    values && Object.fromEntries(Object.entries(values).map(([key, value]) => [shift(Number(key)), value]));
  const keyed = <T,>(values: Record<string, T> | undefined): Record<string, T> | undefined =>
    values && Object.fromEntries(Object.entries(values).map(([key, value]) => {
      const [index, ...rest] = key.split(":");
      return [[shift(Number(index)), ...rest].join(":"), value];
    }));
  const next: LessonEdits = {
    ...edits,
    deletedSections: edits.deletedSections?.map(shift),
    headings: numbered(edits.headings),
    paragraphs: keyed(edits.paragraphs),
    bullets: keyed(edits.bullets),
    cards: keyed(edits.cards),
    examples: keyed(edits.examples),
    tableCells: keyed(edits.tableCells),
    sectionBody: numbered(edits.sectionBody),
    videos: numbered(edits.videos),
    generatedQuizzes: numbered(edits.generatedQuizzes),
    quizRetries: numbered(edits.quizRetries),
    figureOrder: numbered(edits.figureOrder),
    figureSections: { ...Object.fromEntries(Object.entries(edits.figureSections ?? {}).map(([id, index]) => [id, shift(index)])), ...Object.fromEntries(addedFigureIds.map(id => {
      const match = id.match(/^lesson-added-(\d+)-/);
      if (!match) throw new Error(`Cannot move an added figure with an invalid slide id: ${id}`);
      const original = Number(match[1]);
      return [id, shift(edits.figureSections?.[id] ?? original)];
    })) },
  };
  // The split fragments already contain the edited text, and questions follow
  // the continuation rather than gating the first fragment.
  if (next.sectionBody) delete next.sectionBody[si];
  if (next.paragraphs) for (const key of Object.keys(next.paragraphs)) if (key.startsWith(`${si}:`)) delete next.paragraphs[key];
  if (next.bullets) for (const key of Object.keys(next.bullets)) if (key.startsWith(`${si}:`)) delete next.bullets[key];
  if (next.generatedQuizzes?.[si]) {
    next.generatedQuizzes[si + 1] = next.generatedQuizzes[si];
    delete next.generatedQuizzes[si];
  }
  return next;
}
