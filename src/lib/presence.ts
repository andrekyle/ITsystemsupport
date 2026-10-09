import type { Profile } from "../types";
import { supabase } from "./supabase";
import { TENANT_ID } from "./tenant";

const PREFIX = "itss.presence.";
const HEARTBEAT_MS = 30_000;
export const PRESENCE_WINDOW_MS = 2 * 60_000;

export interface PresenceEntry {
  profileId: string;
  name: string;
  email?: string;
  idNumber?: string;
  seenAt: string;
}

function entry(profile: Profile): PresenceEntry {
  return {
    profileId: profile.id,
    name: profile.name,
    ...(profile.enrolment?.email ? { email: profile.enrolment.email } : {}),
    ...(profile.enrolment?.idNumber ? { idNumber: profile.enrolment.idNumber } : {}),
    seenAt: new Date().toISOString(),
  };
}

async function heartbeat(profile: Profile): Promise<void> {
  if (!supabase) return;
  const value = JSON.stringify(entry(profile));
  const { error } = await supabase.from("shared_state").upsert(
    {
      tenant_id: TENANT_ID,
      key: `${PREFIX}${profile.id}`,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,key" },
  );
  if (error) console.error("Presence heartbeat failed:", error);
}

/** Publish an independent heartbeat for the actually signed-in profile. */
export function startPresence(profile: Profile): () => void {
  if (!supabase) return () => {};
  const send = () => void heartbeat(profile);
  send();
  const timer = window.setInterval(send, HEARTBEAT_MS);
  const onVisible = () => { if (document.visibilityState === "visible") send(); };
  window.addEventListener("focus", send);
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", send);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

/** Read currently-live heartbeats. Expired rows are harmless and ignored. */
export async function fetchPresence(): Promise<PresenceEntry[] | null> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("shared_state")
    .select("value")
    .eq("tenant_id", TENANT_ID)
    .like("key", `${PREFIX}%`);
  if (error) {
    console.error("Presence refresh failed:", error);
    return null;
  }
  const cutoff = Date.now() - PRESENCE_WINDOW_MS;
  const entries: PresenceEntry[] = [];
  for (const row of data ?? []) {
    try {
      const value = JSON.parse(row.value) as PresenceEntry;
      if (value.profileId && Date.parse(value.seenAt) >= cutoff) entries.push(value);
    } catch {
      /* ignore one malformed heartbeat */
    }
  }
  return entries;
}
