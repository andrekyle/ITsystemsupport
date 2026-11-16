import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { TENANT_ID } from "./tenant";
import type { PoeDoc } from "../types";

export type PortfolioValue = string | boolean | string[][] | { doc: PoeDoc; status?: string; reviewer?: string; reviewedAt?: string; note?: string };
export type PortfolioValues = Record<string, PortfolioValue>;
export const portfolioPrefix = (id: string) => `itss.skills-evidence.${id}.`;
const cacheKey = (id: string) => `itssDevice.skills-evidence.${TENANT_ID}.${id}`;
function cached(id: string): { values: PortfolioValues; pending: PortfolioValues } {
  try { return JSON.parse(localStorage.getItem(cacheKey(id)) ?? '{"values":{},"pending":{}}'); }
  catch { return { values: {}, pending: {} }; }
}
export function mergePortfolioRows(rows: { key: string; value: string; updated_at: string }[], id: string): PortfolioValues {
  const values: PortfolioValues = {};
  const prefix = portfolioPrefix(id);
  for (const row of [...rows].sort((a, b) => a.updated_at.localeCompare(b.updated_at))) {
    if (!row.key.startsWith(prefix)) continue;
    try { values[row.key.slice(prefix.length)] = JSON.parse(row.value); } catch { /* Keep valid records. */ }
  }
  return values;
}

/** Each field is stored independently so administrators do not overwrite unrelated edits. */
export function useSkillsPortfolio(learnerId: string) {
  const [state, setState] = useState({ id: learnerId, ...cached(learnerId), loading: true, saving: false, error: "" });
  const current = useRef(state);
  current.current = state;
  const [revision, refresh] = useState(0);
  useEffect(() => {
    let alive = true;
    const initial = { id: learnerId, ...cached(learnerId), loading: true, saving: false, error: "" };
    current.current = initial; setState(initial);
    void (async () => {
      let values = initial.values;
      let error = "";
      try {
        if (supabase && learnerId) {
          const rows: { key: string; value: string; updated_at: string }[] = [];
          for (let offset = 0; ; offset += 1000) {
            const result = await supabase.from("app_state").select("key,value,updated_at")
              .eq("tenant_id", TENANT_ID).like("key", `${portfolioPrefix(learnerId)}%`).order("key").range(offset, offset + 999).abortSignal(AbortSignal.timeout(20000));
            if (result.error) throw result.error;
            rows.push(...(result.data ?? []));
            if ((result.data?.length ?? 0) < 1000) break;
          }
          values = mergePortfolioRows(rows, learnerId);
        }
      } catch { error = "Could not load saved portfolio records. Retry before making changes."; }
      if (!alive) return;
      const local = cached(learnerId);
      const next = { ...initial, values: { ...values, ...local.pending }, pending: local.pending, loading: false, error };
      current.current = next; setState(next);
    })();
    return () => { alive = false; };
  }, [learnerId, revision]);

  function update(key: string, value: PortfolioValue) {
    const fresh = current.current;
    if (!learnerId || fresh.id !== learnerId || fresh.loading || fresh.error) return;
    const next = { ...fresh, values: { ...fresh.values, [key]: value }, pending: { ...fresh.pending, [key]: value } };
    try { localStorage.setItem(cacheKey(learnerId), JSON.stringify({ values: next.values, pending: next.pending })); }
    catch { setState({ ...fresh, error: "Local storage is full. This change was not saved." }); return; }
    current.current = next; setState(next);
  }
  async function save() {
    const fresh = current.current;
    if (fresh.id !== learnerId || fresh.loading || fresh.saving || fresh.error) return false;
    const pending = { ...fresh.pending };
    if (!Object.keys(pending).length) return true;
    current.current = { ...fresh, saving: true }; setState(current.current);
    try {
      if (supabase) {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) throw new Error("Please sign in again to save.");
        const { error } = await supabase.from("app_state").upsert(Object.entries(pending).map(([key, value]) => ({
          tenant_id: TENANT_ID, user_id: data.user!.id, key: portfolioPrefix(learnerId) + key,
          value: JSON.stringify(value), updated_at: new Date().toISOString(),
        })), { onConflict: "tenant_id,user_id,key" });
        if (error) throw new Error("Could not save to the platform. Your draft is retained on this device; try again.");
      }
      const latest = current.current.id === learnerId ? current.current : { ...fresh, ...cached(learnerId) };
      const remaining = { ...latest.pending };
      for (const [key, value] of Object.entries(pending)) if (JSON.stringify(remaining[key]) === JSON.stringify(value)) delete remaining[key];
      localStorage.setItem(cacheKey(learnerId), JSON.stringify({ values: latest.values, pending: remaining }));
      if (current.current.id === learnerId) { current.current = { ...latest, pending: remaining, saving: false }; setState(current.current); }
      return true;
    } catch (error) {
      if (current.current.id === learnerId) { current.current = { ...current.current, saving: false, error: error instanceof Error ? error.message : "Save failed." }; setState(current.current); }
      return false;
    }
  }
  const visible = state.id === learnerId ? state : { ...state, values: {}, pending: {}, loading: true };
  return { ...visible, update, save, refresh: () => refresh(value => value + 1), dirty: Object.keys(visible.pending).length > 0 };
}
