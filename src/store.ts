import { useCallback, useEffect, useState } from "react";
import type { EnrolmentInfo, PoeDoc, Profile, ProgressState, Role, UnitActivity, UnitProgress } from "./types";
import { UNIT_ACTIVITIES } from "./types";
import { MODULES } from "./data/course";

const PROFILES_KEY = "itss.profiles";
const SESSION_KEY = "itss.session";
const THEME_KEY = "itss.theme";
const progressKey = (profileId: string) => `itss.progress.${profileId}`;

export type Theme = "light" | "dark";

export function getTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- profiles ---------- */

/** The designated super user of this installation — promoted automatically. */
const SUPER_USER_NAME = "Andre Snell";

export function loadProfiles(): Profile[] {
  const profiles = read<Profile[]>(PROFILES_KEY, []);
  let changed = false;
  for (const p of profiles) {
    if (p.name === SUPER_USER_NAME && p.role !== "Super User") {
      p.role = "Super User";
      changed = true;
    }
    // no one else may hold the Super User role
    if (p.name !== SUPER_USER_NAME && p.role === "Super User") {
      p.role = "Facilitator";
      changed = true;
    }
  }
  if (changed) write(PROFILES_KEY, profiles);
  return profiles;
}

export function createProfile(
  name: string,
  role: Role,
  enrolment?: EnrolmentInfo,
  passwordHash?: string
): Profile {
  const profile: Profile = {
    id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    role,
    createdAt: new Date().toISOString(),
    ...(enrolment ? { enrolment } : {}),
    ...(passwordHash ? { passwordHash } : {}),
  };
  write(PROFILES_KEY, [...loadProfiles(), profile]);
  return profile;
}

/** SHA-256 hex hash used for sign-in passwords. */
export async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Read a profile's POE documents without subscribing (for lists/counts). */
export function loadPoeDocs(profileId: string): Record<string, PoeDoc> {
  return read<Record<string, PoeDoc>>(`itss.poe.${profileId}`, {});
}

export function deleteProfile(id: string) {
  write(PROFILES_KEY, loadProfiles().filter((p) => p.id !== id));
  localStorage.removeItem(progressKey(id));
  localStorage.removeItem(`itss.poe.${id}`);
  localStorage.removeItem(`itss.notes.${id}`);
  localStorage.removeItem(`itss.noteorder.${id}`);
  localStorage.removeItem(`itss.notetitles.${id}`);
}

export function updateProfile(id: string, patch: Partial<Profile>): Profile | undefined {
  const profiles = loadProfiles();
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  const updated = { ...profiles[idx], ...patch, id };
  profiles[idx] = updated;
  write(PROFILES_KEY, profiles);
  return updated;
}

export function getSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setSession(profileId: string | null) {
  if (profileId) localStorage.setItem(SESSION_KEY, profileId);
  else localStorage.removeItem(SESSION_KEY);
}

/* ---------- progress ---------- */

const EMPTY: ProgressState = { units: {} };

export function useProgress(profileId: string) {
  const [state, setState] = useState<ProgressState>(() =>
    read<ProgressState>(progressKey(profileId), EMPTY)
  );

  useEffect(() => {
    setState(read<ProgressState>(progressKey(profileId), EMPTY));
  }, [profileId]);

  // live-sync when another tab writes this profile's progress
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === progressKey(profileId)) {
        setState(read<ProgressState>(progressKey(profileId), EMPTY));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [profileId]);

  const update = useCallback(
    (fn: (prev: ProgressState) => ProgressState) => {
      // base updates on fresh storage so concurrent tabs never clobber each other
      const fresh = read<ProgressState>(progressKey(profileId), EMPTY);
      const next = fn(fresh);
      write(progressKey(profileId), next);
      setState(next);
    },
    [profileId]
  );

  const toggleActivity = useCallback(
    (us: string, activity: UnitActivity) => {
      update((prev) => {
        const unit: UnitProgress = prev.units[us] ?? { activities: {} };
        const done = !unit.activities[activity];
        return {
          ...prev,
          units: {
            ...prev.units,
            [us]: { ...unit, activities: { ...unit.activities, [activity]: done } },
          },
        };
      });
    },
    [update]
  );

  const saveQuizResult = useCallback(
    (us: string, score: number, total: number) => {
      update((prev) => {
        const unit: UnitProgress = prev.units[us] ?? { activities: {} };
        const q = unit.quiz;
        const history = [
          { score, total, date: new Date().toISOString() },
          ...(q?.history ?? []),
        ].slice(0, 3);
        return {
          ...prev,
          units: {
            ...prev.units,
            [us]: {
              ...unit,
              quiz: {
                best: Math.max(q?.best ?? 0, score),
                total,
                attempts: (q?.attempts ?? 0) + 1,
                history,
              },
            },
          },
        };
      });
    },
    [update]
  );

  const setLogbookField = useCallback(
    (us: string, key: string, value: string | boolean) => {
      update((prev) => {
        const unit: UnitProgress = prev.units[us] ?? { activities: {} };
        return {
          ...prev,
          units: {
            ...prev.units,
            [us]: { ...unit, logbook: { ...unit.logbook, [key]: value } },
          },
        };
      });
    },
    [update]
  );

  return { state, toggleActivity, saveQuizResult, setLogbookField };
}

/* ---------- shared app settings (controlled by the super user) ---------- */

const SHARED_SETTINGS_KEY = "itss.settings.shared";

export interface SharedSettings {
  /** allow non-super users to download shared/staff-uploaded content */
  allowSharedDownloads: boolean;
}

const DEFAULT_SHARED_SETTINGS: SharedSettings = { allowSharedDownloads: false };

function readSharedSettings(): SharedSettings {
  return { ...DEFAULT_SHARED_SETTINGS, ...read<Partial<SharedSettings>>(SHARED_SETTINGS_KEY, {}) };
}

export function useSharedSettings(): [SharedSettings, (patch: Partial<SharedSettings>) => void] {
  const [settings, setSettings] = useState<SharedSettings>(readSharedSettings);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SHARED_SETTINGS_KEY) setSettings(readSharedSettings());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((patch: Partial<SharedSettings>) => {
    const next = { ...readSharedSettings(), ...patch };
    write(SHARED_SETTINGS_KEY, next);
    setSettings(next);
  }, []);

  return [settings, update];
}

/* ---------- Appendix C checklist (per profile) ---------- */

export type ChecklistTick = "yes" | "no";

const checklistKey = (profileId: string) => `itss.checklist.${profileId}`;

export function useChecklist(profileId: string) {
  const [ticks, setTicks] = useState<Record<string, ChecklistTick>>(() =>
    read<Record<string, ChecklistTick>>(checklistKey(profileId), {})
  );

  useEffect(() => {
    setTicks(read<Record<string, ChecklistTick>>(checklistKey(profileId), {}));
  }, [profileId]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === checklistKey(profileId)) {
        setTicks(read<Record<string, ChecklistTick>>(checklistKey(profileId), {}));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [profileId]);

  const setTick = useCallback(
    (itemId: string, value: ChecklistTick | null) => {
      const fresh = read<Record<string, ChecklistTick>>(checklistKey(profileId), {});
      const next = { ...fresh };
      if (value === null) delete next[itemId];
      else next[itemId] = value;
      write(checklistKey(profileId), next);
      setTicks(next);
    },
    [profileId]
  );

  return { ticks, setTick };
}

/* ---------- Section D: required evidence & declaration (per profile) ---------- */

const sectionDKey = (profileId: string) => `itss.sectiond.${profileId}`;

export function useSectionD(profileId: string) {
  const [fields, setFields] = useState<Record<string, string>>(() =>
    read<Record<string, string>>(sectionDKey(profileId), {})
  );

  useEffect(() => {
    setFields(read<Record<string, string>>(sectionDKey(profileId), {}));
  }, [profileId]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === sectionDKey(profileId)) {
        setFields(read<Record<string, string>>(sectionDKey(profileId), {}));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [profileId]);

  const setField = useCallback(
    (id: string, value: string | null) => {
      const fresh = read<Record<string, string>>(sectionDKey(profileId), {});
      const next = { ...fresh };
      if (value === null || value === "") delete next[id];
      else next[id] = value;
      write(sectionDKey(profileId), next);
      setFields(next);
    },
    [profileId]
  );

  return { fields, setField };
}

/* ---------- POE documents (stored separately per profile) ---------- */

const poeKey = (profileId: string) => `itss.poe.${profileId}`;

export function usePoe(profileId: string) {
  const [docs, setDocs] = useState<Record<string, PoeDoc>>(() =>
    read<Record<string, PoeDoc>>(poeKey(profileId), {})
  );

  useEffect(() => {
    setDocs(read<Record<string, PoeDoc>>(poeKey(profileId), {}));
  }, [profileId]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === poeKey(profileId)) {
        setDocs(read<Record<string, PoeDoc>>(poeKey(profileId), {}));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [profileId]);

  const saveDoc = useCallback(
    (itemId: string, doc: PoeDoc): boolean => {
      const fresh = read<Record<string, PoeDoc>>(poeKey(profileId), {});
      const next = { ...fresh, [itemId]: doc };
      try {
        write(poeKey(profileId), next);
      } catch {
        return false; // storage quota exceeded
      }
      setDocs(next);
      return true;
    },
    [profileId]
  );

  const removeDoc = useCallback(
    (itemId: string) => {
      const fresh = read<Record<string, PoeDoc>>(poeKey(profileId), {});
      const doomed = fresh[itemId];
      const next = { ...fresh };
      delete next[itemId];
      write(poeKey(profileId), next);
      setDocs(next);
      if (doomed?.path) void import("./lib/files").then((m) => m.deleteFile(doomed.path));
    },
    [profileId]
  );

  return { docs, saveDoc, removeDoc };
}

/* ---------- facilitator-uploaded lesson-plan slides (shared per unit standard) ---------- */

const planSlidesKey = (us: string) => `itss.planslides.${us}`;

export function usePlanSlides(us: string) {
  const [slides, setSlides] = useState<PoeDoc[]>(() => read<PoeDoc[]>(planSlidesKey(us), []));

  useEffect(() => {
    setSlides(read<PoeDoc[]>(planSlidesKey(us), []));
  }, [us]);

  const addSlide = useCallback(
    (doc: PoeDoc): boolean => {
      const next = [...read<PoeDoc[]>(planSlidesKey(us), []), doc];
      try {
        write(planSlidesKey(us), next);
      } catch {
        return false; // storage quota exceeded
      }
      setSlides(next);
      return true;
    },
    [us]
  );

  const removeSlide = useCallback(
    (index: number) => {
      const fresh = read<PoeDoc[]>(planSlidesKey(us), []);
      const doomed = fresh[index];
      const next = fresh.filter((_, i) => i !== index);
      write(planSlidesKey(us), next);
      setSlides(next);
      if (doomed?.path) void import("./lib/files").then((m) => m.deleteFile(doomed.path));
    },
    [us]
  );

  return { slides, addSlide, removeSlide };
}

/* ---------- user-uploaded notes (stored separately per profile) ---------- */

export interface UserNote {
  us: string;
  title: string;
  /** data-URL of the image */
  image: string;
  uploadedAt: string;
}

const notesKey = (profileId: string) => `itss.notes.${profileId}`;
const noteOrderKey = (profileId: string) => `itss.noteorder.${profileId}`;
const noteTitlesKey = (profileId: string) => `itss.notetitles.${profileId}`;
const SHARED_NOTES_KEY = "itss.notes.shared";

export function useNotes(profileId: string) {
  const [notes, setNotes] = useState<Record<string, UserNote>>(() =>
    read<Record<string, UserNote>>(notesKey(profileId), {})
  );
  const [order, setOrderState] = useState<Record<string, string[]>>(() =>
    read<Record<string, string[]>>(noteOrderKey(profileId), {})
  );
  const [titleOverrides, setTitleOverridesState] = useState<Record<string, string>>(() =>
    read<Record<string, string>>(noteTitlesKey(profileId), {})
  );
  const [sharedNotes, setSharedNotes] = useState<Record<string, UserNote>>(() =>
    read<Record<string, UserNote>>(SHARED_NOTES_KEY, {})
  );

  useEffect(() => {
    setNotes(read<Record<string, UserNote>>(notesKey(profileId), {}));
    setOrderState(read<Record<string, string[]>>(noteOrderKey(profileId), {}));
    setTitleOverridesState(read<Record<string, string>>(noteTitlesKey(profileId), {}));
  }, [profileId]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === notesKey(profileId)) {
        setNotes(read<Record<string, UserNote>>(notesKey(profileId), {}));
      }
      if (e.key === noteOrderKey(profileId)) {
        setOrderState(read<Record<string, string[]>>(noteOrderKey(profileId), {}));
      }
      if (e.key === noteTitlesKey(profileId)) {
        setTitleOverridesState(read<Record<string, string>>(noteTitlesKey(profileId), {}));
      }
      if (e.key === SHARED_NOTES_KEY) {
        setSharedNotes(read<Record<string, UserNote>>(SHARED_NOTES_KEY, {}));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [profileId]);

  const setTitleOverride = useCallback(
    (id: string, title: string) => {
      const fresh = read<Record<string, string>>(noteTitlesKey(profileId), {});
      const next = { ...fresh, [id]: title };
      write(noteTitlesKey(profileId), next);
      setTitleOverridesState(next);
    },
    [profileId]
  );

  const setNoteOrder = useCallback(
    (us: string, ids: string[]) => {
      const fresh = read<Record<string, string[]>>(noteOrderKey(profileId), {});
      const next = { ...fresh, [us]: ids };
      write(noteOrderKey(profileId), next);
      setOrderState(next);
    },
    [profileId]
  );

  const addNote = useCallback(
    (id: string, note: UserNote): boolean => {
      const fresh = read<Record<string, UserNote>>(notesKey(profileId), {});
      const next = { ...fresh, [id]: note };
      try {
        write(notesKey(profileId), next);
      } catch {
        return false;
      }
      setNotes(next);
      return true;
    },
    [profileId]
  );

  const removeNote = useCallback(
    (id: string) => {
      const fresh = read<Record<string, UserNote>>(notesKey(profileId), {});
      const next = { ...fresh };
      delete next[id];
      write(notesKey(profileId), next);
      setNotes(next);
    },
    [profileId]
  );

  const renameNote = useCallback(
    (id: string, title: string) => {
      const fresh = read<Record<string, UserNote>>(notesKey(profileId), {});
      if (!fresh[id]) return;
      const next = { ...fresh, [id]: { ...fresh[id], title } };
      write(notesKey(profileId), next);
      setNotes(next);
    },
    [profileId]
  );

  const addSharedNote = useCallback((id: string, note: UserNote): boolean => {
    const fresh = read<Record<string, UserNote>>(SHARED_NOTES_KEY, {});
    const next = { ...fresh, [id]: note };
    try {
      write(SHARED_NOTES_KEY, next);
    } catch {
      return false;
    }
    setSharedNotes(next);
    return true;
  }, []);

  const removeSharedNote = useCallback((id: string) => {
    const fresh = read<Record<string, UserNote>>(SHARED_NOTES_KEY, {});
    const next = { ...fresh };
    delete next[id];
    write(SHARED_NOTES_KEY, next);
    setSharedNotes(next);
  }, []);

  const renameSharedNote = useCallback((id: string, title: string) => {
    const fresh = read<Record<string, UserNote>>(SHARED_NOTES_KEY, {});
    if (!fresh[id]) return;
    const next = { ...fresh, [id]: { ...fresh[id], title } };
    write(SHARED_NOTES_KEY, next);
    setSharedNotes(next);
  }, []);

  return {
    notes,
    sharedNotes,
    addNote,
    addSharedNote,
    removeNote,
    removeSharedNote,
    renameNote,
    renameSharedNote,
    order,
    setNoteOrder,
    titleOverrides,
    setTitleOverride,
  };
}

/* ---------- derived stats ---------- */

export function unitCompletion(state: ProgressState, us: string): number {
  const p = state.units[us];
  if (!p) return 0;
  const done = UNIT_ACTIVITIES.filter((a) => p.activities[a]).length;
  return done / UNIT_ACTIVITIES.length;
}

export function unitStatus(state: ProgressState, us: string): "not-started" | "in-progress" | "completed" {
  const c = unitCompletion(state, us);
  if (c === 0) return "not-started";
  if (c === 1) return "completed";
  return "in-progress";
}

export function moduleCompletion(state: ProgressState, moduleId: string): number {
  const mod = MODULES.find((m) => m.id === moduleId);
  if (!mod || mod.units.length === 0) return 0;
  const sum = mod.units.reduce((n, u) => n + unitCompletion(state, u.us), 0);
  return sum / mod.units.length;
}

export function overallStats(state: ProgressState) {
  let unitsCompleted = 0;
  let unitsInProgress = 0;
  let creditsEarned = 0;
  let completionSum = 0;
  let total = 0;
  for (const m of MODULES) {
    for (const u of m.units) {
      total++;
      const c = unitCompletion(state, u.us);
      completionSum += c;
      if (c === 1) {
        unitsCompleted++;
        creditsEarned += u.credits;
      } else if (c > 0) {
        unitsInProgress++;
      }
    }
  }
  return {
    unitsCompleted,
    unitsInProgress,
    creditsEarned,
    overall: total ? completionSum / total : 0,
    modulesCompleted: MODULES.filter((m) => moduleCompletion(state, m.id) === 1).length,
  };
}
