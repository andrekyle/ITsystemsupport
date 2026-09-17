import type { PoeDoc, UnitContent } from "../types";
import { unitPackSnapshot } from "./unitStorage";

export type UnitFiles = { pdf: PoeDoc; pptx: PoeDoc; answers: PoeDoc };
export type BuiltUnitVersion = { revision: string; source: string; content: UnitContent; files: UnitFiles; createdAt: string; aiUsed: boolean };
export type BuiltUnit = BuiltUnitVersion & { previous?: BuiltUnitVersion };
export const builtUnitKey = (us: string) => `itss.unitbuilder.${us}.shared`;
export function readBuiltUnit(us: string): BuiltUnit | undefined {
  try {
    if (typeof localStorage === "undefined") return;
    const data = JSON.parse(unitPackSnapshot(builtUnitKey(us)) ?? "null");
    return data?.content?.lesson && data?.revision && data?.files ? data : undefined;
  } catch { return undefined; }
}
