import type { Exercise, UnitContent } from "../types";

export type ActivityOverrides = Record<string, Exercise | null>;
/** Overlay activity edits without replacing lessons, quizzes, documents or other activities. */
export function applyActivityOverrides(content: UnitContent, overrides: ActivityOverrides = {}): UnitContent {
  const result = { ...content };
  for (const kind of ["exercises", "questionSessions"] as const) {
    const original = content[kind] ?? [];
    const items = original.flatMap(item => {
      const key = `${kind}:${item.id}`;
      return key in overrides ? overrides[key] ? [overrides[key]!] : [] : [item];
    });
    for (const [key, item] of Object.entries(overrides)) {
      if (key.startsWith(`${kind}:`) && item && !original.some(existing => existing.id === item.id)) items.push(item);
    }
    if (kind === "exercises" || content.questionSessions || items.length) result[kind] = items;
  }
  return result;
}
