import { useCallback, useEffect, useMemo, useState } from "react";
import type { EnrolmentInfo, PoeDoc, Profile, ProgressState, Role, UnitActivity, UnitProgress } from "./types";
import { UNIT_ACTIVITIES } from "./types";
import { MODULES, POE_SECTIONS } from "./data/course";
import { cloudEnabled, supabase } from "./lib/supabase";
import { flushKey } from "./lib/sync";
import { logAudit } from "./lib/audit";

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
/**
 * The ONE and only cloud account that may hold the Super User role.
 * The `admins` table is still consulted for server-side RLS (so this account
 * can moderate chat, etc.), but no other account is ever promoted to Super
 * User in the client — even if it appears in that table by mistake.
 */
const SUPER_USER_EMAIL = "andresnell29@gmail.com";

let accountEmail: string | null = null;
/** Set by App whenever the cloud session changes — gates super-user promotion. */
export function setAccountEmail(email: string | null | undefined) {
  accountEmail = email ? email.trim().toLowerCase() : null;
}

let accountIsAdmin = false;
/**
 * Set by App from the `admins` table. Kept for potential server-driven UI
 * hints; it deliberately does NOT influence Super User promotion — only the
 * single hard-coded {@link SUPER_USER_EMAIL} account may hold that role.
 */
export function setAccountAdmin(isAdmin: boolean) {
  accountIsAdmin = isAdmin;
}
/** Whether the current cloud account is listed in the `admins` table.
 *  Not used to grant the Super User role — see {@link onSuperAccount}. */
export function isAccountAdmin(): boolean {
  return accountIsAdmin;
}

/** True when the current cloud account is entitled to the Super User role. */
function onSuperAccount(): boolean {
  return cloudEnabled ? accountEmail === SUPER_USER_EMAIL : true;
}

/** True when this name identifies the designated super user (exempt from the
 *  staff access code — they are auto-promoted on sign-in anyway). */
export function isDesignatedSuperUser(name: string): boolean {
  const nm = name.trim().toLowerCase();
  return nm === SUPER_USER_NAME.trim().toLowerCase() || nm === SUPER_USER_EMAIL;
}

export function loadProfiles(): Profile[] {
  const profiles = read<Profile[]>(PROFILES_KEY, []);
  // In cloud mode only the one designated super-user email holds Super User;
  // in local-only mode the designated name identifies the super user.
  const superAccount = onSuperAccount();
  const superName = SUPER_USER_NAME.trim().toLowerCase();
  const currentSessionId =
    typeof localStorage !== "undefined" ? localStorage.getItem(SESSION_KEY) : null;
  let changed = false;
  for (const p of profiles) {
    const nm = p.name.trim().toLowerCase();
    const enrolEmail = p.enrolment?.email?.trim().toLowerCase() ?? "";
    // Entitled to the Super User role:
    //   - the designated super-user name (case-insensitive),
    //   - the super-user email as a profile name,
    //   - in cloud mode: a profile whose *name or enrolment email* matches the
    //     signed-in admin email — that identifies the admin's own profile
    //     even after they've edited their display name.
    //   - in cloud mode: the profile the admin is actively signed in as (their
    //     own local id), so their session doesn't demote them if they picked a
    //     display name that doesn't match their email.
    // A learner signing in on a non-admin cloud account is never promoted
    // because `superAccount` gates the entire branch.
    const entitled =
      superAccount &&
      (nm === superName ||
        nm === SUPER_USER_EMAIL ||
        (cloudEnabled &&
          !!accountEmail &&
          (nm === accountEmail ||
            enrolEmail === accountEmail ||
            (!!currentSessionId && p.id === currentSessionId))));
    if (entitled && p.role !== "Super User") {
      p.baseRole = p.role; // remember the real role for when the promotion lapses
      p.role = "Super User";
      changed = true;
    }
    // no one else may ever hold the Super User role — restore their real role
    if (!entitled && p.role === "Super User") {
      p.role = p.baseRole && p.baseRole !== "Super User" ? p.baseRole : "Facilitator";
      delete p.baseRole;
      changed = true;
    }
    // on the super user's cloud account, other profiles are only ever opened
    // for inspection — any last-login stamp on them is an artifact, clear it.
    // Never clear the currently-signed-in session's stamp: that person is
    // actually online, even if their auth account also carries admin rights.
    if (
      cloudEnabled &&
      superAccount &&
      p.role !== "Super User" &&
      p.lastLogin &&
      p.id !== currentSessionId
    ) {
      delete p.lastLogin;
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
  const existing = loadProfiles();
  const dup = findDuplicateProfile(existing, { name, enrolment });
  if (dup) throw new DuplicateProfileError(dup);
  const profile: Profile = {
    id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    role,
    createdAt: new Date().toISOString(),
    ...(enrolment ? { enrolment } : {}),
    ...(passwordHash ? { passwordHash } : {}),
  };
  write(PROFILES_KEY, [...existing, profile]);
  return profile;
}

/** Thrown by createProfile / assertNoDuplicateProfile when a profile that
 *  matches an existing one (by ID number, email, or full name) is submitted.
 *  Callers surface the message to the user and abort the sign-up flow. */
export class DuplicateProfileError extends Error {
  readonly existing: Profile;
  constructor(existing: Profile, message?: string) {
    super(message ?? duplicateProfileMessage(existing));
    this.name = "DuplicateProfileError";
    this.existing = existing;
  }
}

function duplicateProfileMessage(existing: Profile): string {
  return `An account for ${existing.name} already exists. Users cannot have two accounts — sign in with the existing profile instead.`;
}

const norm = (s: string | undefined) => (s ?? "").trim().toLowerCase();

/** Returns the first profile in `candidates` that identifies the same person
 *  as `attempt`. Match rules (all case-insensitive):
 *   - non-blank enrolment ID number matches, OR
 *   - non-blank enrolment email matches, OR
 *   - trimmed full name matches. */
export function findDuplicateProfile(
  candidates: Profile[],
  attempt: { name: string; enrolment?: EnrolmentInfo }
): Profile | undefined {
  const name = norm(attempt.name);
  const id = norm(attempt.enrolment?.idNumber);
  const email = norm(attempt.enrolment?.email);
  return candidates.find((p) => {
    if (name && norm(p.name) === name) return true;
    if (id && norm(p.enrolment?.idNumber) === id) return true;
    if (email && norm(p.enrolment?.email) === email) return true;
    return false;
  });
}

/** Throws DuplicateProfileError if a matching profile already exists in
 *  `candidates` (typically local + cloud profiles combined). Used by sign-up
 *  flows *before* they call createProfile so cloud-only duplicates are caught. */
export function assertNoDuplicateProfile(
  candidates: Profile[],
  attempt: { name: string; enrolment?: EnrolmentInfo }
) {
  const dup = findDuplicateProfile(candidates, attempt);
  if (dup) throw new DuplicateProfileError(dup);
}

/* ---------- password hashing (salted PBKDF2, legacy SHA-256 supported) ---------- */

const PBKDF2_ITERATIONS = 150_000;

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const fromHex = (hex: string) =>
  new Uint8Array((hex.match(/.{2}/g) ?? []).map((h) => parseInt(h, 16)));

async function pbkdf2Hex(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    256
  );
  return toHex(bits);
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return toHex(buf);
}

/** Hash a sign-in password with salted PBKDF2 (format: pbkdf2$iterations$salt$hash). */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2Hex(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${hash}`;
}

/** Check a password against a stored hash. Accepts current PBKDF2 hashes and
 *  legacy unsalted SHA-256 hex hashes created by earlier versions. */
export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  if (!stored) return false;
  if (stored.startsWith("pbkdf2$")) {
    const [, iterStr, saltHex, hashHex] = stored.split("$");
    const iterations = Number(iterStr);
    if (!iterations || !saltHex || !hashHex) return false;
    return (await pbkdf2Hex(password, fromHex(saltHex), iterations)) === hashHex;
  }
  return (await sha256Hex(password)) === stored;
}

/** Read a profile's POE documents without subscribing (for lists/counts). */
export function loadPoeDocs(profileId: string): Record<string, PoeDoc> {
  return read<Record<string, PoeDoc>>(`itss.poe.${profileId}`, {});
}

/** Number of POE items with at least one uploaded file (multi-file keys use "id__n"). */
export function poeItemCount(docs: Record<string, PoeDoc>): number {
  return new Set(Object.keys(docs).map((k) => k.split("__")[0])).size;
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

const LAST_PROFILE_KEY = "itss.lastprofile";

/** The most recently active profile id on this device — used to pre-select
 *  the right card on the SignIn picker so a super/facilitator who has many
 *  seeded student profiles doesn't accidentally click a student's row. */
export function getLastProfileId(): string | null {
  return localStorage.getItem(LAST_PROFILE_KEY);
}

/** Forget the most-recently-used profile on this device — called when the user
 *  removes that profile from the sign-in picker. */
export function forgetLastProfileId() {
  localStorage.removeItem(LAST_PROFILE_KEY);
}

export function setSession(profileId: string | null) {
  if (profileId) {
    localStorage.setItem(SESSION_KEY, profileId);
    localStorage.setItem(LAST_PROFILE_KEY, profileId);
    touchLastOnline(profileId);
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Stamp the profile's last-online time — except when the super user opens
 * another profile to inspect it: that is a view, not that person signing in.
 * Called at sign-in and periodically while the app stays open.
 */
export function touchLastOnline(profileId: string) {
  const profiles = read<Profile[]>(PROFILES_KEY, []);
  const p = profiles.find((x) => x.id === profileId);
  // A super/admin viewing someone else's profile shouldn't stamp them as
  // online — but the actively-signed-in profile *is* the person, even when
  // their auth account happens to be an admin. Never suppress the stamp for
  // the current session.
  const currentSessionId =
    typeof localStorage !== "undefined" ? localStorage.getItem(SESSION_KEY) : null;
  const isCurrentSession = currentSessionId === profileId;
  const superViewing =
    cloudEnabled && onSuperAccount() && p?.role !== "Super User" && !isCurrentSession;
  if (p && !superViewing) {
    p.lastLogin = new Date().toISOString();
    write(PROFILES_KEY, profiles);
  }
}

/* ---------- progress ---------- */

const EMPTY: ProgressState = { units: {} };

/** Read a profile's saved progress without subscribing (staff/super-user views). */
export function loadProgress(profileId: string): ProgressState {
  return read<ProgressState>(progressKey(profileId), EMPTY);
}

export function useProgress(profileId: string) {
  const [state, setState] = useState<ProgressState>(() =>
    read<ProgressState>(progressKey(profileId), EMPTY)
  );

  useEffect(() => {
    setState(read<ProgressState>(progressKey(profileId), EMPTY));
  }, [profileId]);

  // One-time backfill per load: credit evidence-backed activities that were
  // recorded before auto-crediting existed, so learners who did quizzes /
  // exercises / POE uploads without ticking the stage no longer read as 0%.
  // Quizzes and marked exercises are both FORMATIVE assessment evidence.
  useEffect(() => {
    const key = progressKey(profileId);
    const cur = read<ProgressState>(key, EMPTY);
    let changed = false;
    const units = { ...cur.units };
    for (const [us, unit] of Object.entries(cur.units)) {
      const acts = { ...unit.activities };
      const hasQuiz =
        !!(unit.quiz && unit.quiz.total) ||
        Object.values(unit.quizzes ?? {}).some((q) => q.total > 0);
      const hasExercise = Object.values(unit.exercises ?? {}).some((e) => e.total > 0);
      if ((hasQuiz || hasExercise) && !acts["Formative Assessment"]) {
        acts["Formative Assessment"] = true;
        changed = true;
      }
      units[us] = { ...unit, activities: acts };
    }
    const poe = read<Record<string, PoeDoc>>(poeKey(profileId), {});
    for (const k of Object.keys(poe)) {
      for (const us of poeDocUnits(k)) {
        const unit = units[us] ?? { activities: {} };
        if (!unit.activities["POE Evidence"]) {
          units[us] = { ...unit, activities: { ...unit.activities, "POE Evidence": true } };
          changed = true;
        }
      }
    }
    if (changed) {
      write(key, { ...cur, units });
      setState(read<ProgressState>(key, EMPTY));
    }
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
    (us: string, score: number, total: number, quizId?: string, attempt?: unknown) => {
      const actor = read<Profile[]>(PROFILES_KEY, []).find((p) => p.id === profileId);
      if (actor) {
        logAudit(actor, "quiz.submit", `US ${us}${quizId ? ` (${quizId})` : ""}: scored ${score}/${total}`);
      }
      update((prev) => {
        const unit: UnitProgress = prev.units[us] ?? { activities: {} };
        const q = quizId ? unit.quizzes?.[quizId] : unit.quiz;
        const history = [
          { score, total, date: new Date().toISOString() },
          ...(q?.history ?? []),
        ].slice(0, 3);
        const result = {
          best: Math.max(q?.best ?? 0, score),
          total,
          attempts: (q?.attempts ?? 0) + 1,
          history,
        };
        // Also persist the per-question snapshot to the logbook so staff can
        // review which options the learner picked, not just the score.
        const logbookKey = `quiz.${quizId ?? "quiz"}.picks`;
        const nextLogbook = attempt !== undefined
          ? { ...unit.logbook, [logbookKey]: JSON.stringify(attempt) }
          : unit.logbook;
        // Quizzes are formative assessment — taking one IS the formative
        // evidence, so credit that activity automatically.
        const nextActivities = { ...unit.activities, "Formative Assessment": true as const };
        return {
          ...prev,
          units: {
            ...prev.units,
            [us]: quizId
              ? { ...unit, activities: nextActivities, logbook: nextLogbook, quizzes: { ...unit.quizzes, [quizId]: result } }
              : { ...unit, activities: nextActivities, logbook: nextLogbook, quiz: result },
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

  const saveExerciseResult = useCallback(
    (us: string, exId: string, score: number, total: number) => {
      const actor = read<Profile[]>(PROFILES_KEY, []).find((p) => p.id === profileId);
      if (actor) {
        logAudit(actor, "exercise.submit", `US ${us} exercise ${exId}: marked ${score}/${total}`);
      }
      update((prev) => {
        const unit: UnitProgress = prev.units[us] ?? { activities: {} };
        const cur = unit.exercises?.[exId];
        return {
          ...prev,
          units: {
            ...prev.units,
            [us]: {
              ...unit,
              // Marked exercise attempts ARE the formative evidence — credit
              // the activity so completion reflects the work automatically.
              activities: { ...unit.activities, "Formative Assessment": true },
              exercises: {
                ...unit.exercises,
                [exId]: {
                  best: Math.max(cur?.best ?? 0, score),
                  last: score,
                  total,
                  attempts: (cur?.attempts ?? 0) + 1,
                },
              },
            },
          },
        };
      });
    },
    [update]
  );

  return { state, toggleActivity, saveQuizResult, setLogbookField, saveExerciseResult };
}

/* ---------- shared app settings (controlled by the super user) ---------- */

const SHARED_SETTINGS_KEY = "itss.settings.shared";

export interface SharedSettings {
  /** allow non-super users to download shared/staff-uploaded content */
  allowSharedDownloads: boolean;
  /** link to the lesson evaluation form (set by the super user) */
  evaluationUrl: string;
  /** access code new sign-ups must enter to register a staff role (empty = staff self-signup disabled) */
  staffCode: string;
  /** link to the cohort's Wayground (Quizizz) space for live gamified quizzes */
  waygroundUrl: string;
  /** support mailbox learners can contact (mailto / Outlook links) */
  supportEmail: string;
  /** link to the cohort's Microsoft Teams team or channel */
  teamsUrl: string;
}

const DEFAULT_SHARED_SETTINGS: SharedSettings = {
  allowSharedDownloads: false,
  evaluationUrl: "",
  staffCode: "",
  waygroundUrl: "",
  supportEmail: "",
  teamsUrl: "",
};

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

/* ---------- generic shared-state hook (synced to every account) ---------- */

/** Subscribe to a shared `itss.*.shared` JSON key. Mutations re-read fresh
 *  storage before writing so concurrent tabs/devices don't clobber each other. */
function useSharedState<T>(key: string, empty: T): [T, (updater: (fresh: T) => T) => T] {
  const [value, setValue] = useState<T>(() => read<T>(key, empty));

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === key) setValue(read<T>(key, empty));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (updater: (fresh: T) => T) => {
      const next = updater(read<T>(key, empty));
      write(key, next);
      setValue(next);
      return next;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  return [value, update];
}

const newId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

/* ---------- announcements (staff → everyone) ---------- */

const ANNOUNCE_KEY = "itss.announce.shared";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  byId: string;
  by: string;
  role: Role;
  at: string;
  pinned?: boolean;
}

export function useAnnouncements() {
  const [list, update] = useSharedState<Announcement[]>(ANNOUNCE_KEY, []);
  const post = useCallback(
    (author: Profile, title: string, body: string) =>
      update((fresh) => [
        {
          id: newId(),
          title: title.trim(),
          body: body.trim(),
          byId: author.id,
          by: author.name,
          role: author.role,
          at: new Date().toISOString(),
        },
        ...fresh,
      ]),
    [update]
  );
  const remove = useCallback(
    (id: string) => update((fresh) => fresh.filter((a) => a.id !== id)),
    [update]
  );
  const togglePin = useCallback(
    (id: string) =>
      update((fresh) => fresh.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a))),
    [update]
  );
  const sorted = [...list].sort((a, b) =>
    a.pinned === b.pinned ? b.at.localeCompare(a.at) : a.pinned ? -1 : 1
  );
  return { announcements: sorted, post, remove, togglePin };
}

/** Read announcements without subscribing (dashboard teaser). */
export function loadAnnouncements(): Announcement[] {
  return [...read<Announcement[]>(ANNOUNCE_KEY, [])].sort((a, b) =>
    a.pinned === b.pinned ? b.at.localeCompare(a.at) : a.pinned ? -1 : 1
  );
}

/* ---------- Q&A support threads (learners ask, staff answer) ---------- */

const QA_KEY = "itss.qa.shared";

export interface QaReply {
  id: string;
  body: string;
  byId: string;
  by: string;
  role: Role;
  at: string;
  /** set when the author edits within the 24-hour window */
  editedAt?: string;
}

export interface QaThread {
  id: string;
  title: string;
  body: string;
  /** unit standard the question relates to (optional) */
  unit?: string;
  byId: string;
  by: string;
  role: Role;
  at: string;
  /** set when the author edits within the 24-hour window */
  editedAt?: string;
  resolved?: boolean;
  replies: QaReply[];
}

export function useQaThreads() {
  const [threads, update] = useSharedState<QaThread[]>(QA_KEY, []);
  const ask = useCallback(
    (author: Profile, title: string, body: string, unit?: string) =>
      update((fresh) => [
        {
          id: newId(),
          title: title.trim(),
          body: body.trim(),
          ...(unit ? { unit } : {}),
          byId: author.id,
          by: author.name,
          role: author.role,
          at: new Date().toISOString(),
          replies: [],
        },
        ...fresh,
      ]),
    [update]
  );
  const reply = useCallback(
    (author: Profile, threadId: string, body: string) =>
      update((fresh) =>
        fresh.map((t) =>
          t.id === threadId
            ? {
                ...t,
                replies: [
                  ...t.replies,
                  {
                    id: newId(),
                    body: body.trim(),
                    byId: author.id,
                    by: author.name,
                    role: author.role,
                    at: new Date().toISOString(),
                  },
                ],
              }
            : t
        )
      ),
    [update]
  );
  const toggleResolved = useCallback(
    (threadId: string) =>
      update((fresh) =>
        fresh.map((t) => (t.id === threadId ? { ...t, resolved: !t.resolved } : t))
      ),
    [update]
  );
  /** Author edit (UI enforces the 24-hour window). Clears `unit` when omitted. */
  const editQuestion = useCallback(
    (threadId: string, title: string, body: string, unit?: string) =>
      update((fresh) =>
        fresh.map((t) => {
          if (t.id !== threadId) return t;
          const { unit: _drop, ...rest } = t;
          return {
            ...rest,
            ...(unit ? { unit } : {}),
            title: title.trim(),
            body: body.trim(),
            editedAt: new Date().toISOString(),
          };
        })
      ),
    [update]
  );
  /** Edit an existing reply's body. UI enforces who may edit + the time window. */
  const editReply = useCallback(
    (threadId: string, replyId: string, body: string) =>
      update((fresh) =>
        fresh.map((t) =>
          t.id !== threadId
            ? t
            : {
                ...t,
                replies: t.replies.map((r) =>
                  r.id !== replyId
                    ? r
                    : { ...r, body: body.trim(), editedAt: new Date().toISOString() }
                ),
              }
        )
      ),
    [update]
  );
  const remove = useCallback(
    (threadId: string) => update((fresh) => fresh.filter((t) => t.id !== threadId)),
    [update]
  );
  return { threads, ask, reply, toggleResolved, editQuestion, editReply, remove };
}

/* ---------- direct chat (1-to-1 conversations, database-enforced privacy) --------- */

/** Deterministic profile-pair key — same value regardless of which side asks.
 *  Used for grouping messages into a conversation on the client. */
const CHAT_PAIR_SEP = "~~"; // profile ids may contain "_" or "-", but never "~"
export const chatPairKey = (a: string, b: string): string => {
  const [x, y] = a < b ? [a, b] : [b, a];
  return `${x}${CHAT_PAIR_SEP}${y}`;
};

export interface ChatMessage {
  id: string;
  byId: string;
  /** the sender's Supabase auth.users.id — the canonical identity of the sender */
  bySenderAuthId: string;
  by: string;
  role: Role;
  body: string;
  at: string;
  /** whether the recipient has read the message */
  read?: boolean;
  /** timestamp of the last edit, if the sender has edited this message */
  editedAt?: string;
  /** the recipient's reaction to this message — "👍" (like) or "❤️" (love) */
  reaction?: string;
}

/** Wire representation of a message row in Supabase. */
interface DbChatRow {
  id: string;
  sender_user_id: string;
  recipient_user_id: string;
  sender_profile_id: string;
  recipient_profile_id: string;
  sender_name: string;
  sender_role: Role;
  body: string;
  sent_at: string;
  read_at: string | null;
  edited_at?: string | null;
  reaction?: string | null;
}

function rowToMessage(row: DbChatRow): ChatMessage {
  return {
    id: row.id,
    byId: row.sender_profile_id,
    bySenderAuthId: row.sender_user_id,
    by: row.sender_name,
    role: row.sender_role,
    body: row.body,
    at: row.sent_at,
    read: !!row.read_at,
    editedAt: row.edited_at ?? undefined,
    reaction: row.reaction ?? undefined,
  };
}

/** Info the caller needs to load / send a specific 1-to-1 conversation. */
export interface ChatPeer {
  /** the other person's app profile id (may differ from their auth id) */
  profileId: string;
  /** the other person's Supabase auth.users id — required to send */
  authUserId?: string;
}

/**
 * Subscribe to a live thread between the current viewer and one other person.
 * Polls Supabase every few seconds; sending inserts a row (RLS enforces
 * that only the sender's auth user can create it). Read receipts update the
 * recipient's own rows.
 */
export function useChat(myProfile: Profile, peer: ChatPeer) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myAuthId, setMyAuthId] = useState<string | null>(null);
  const otherAuthId = peer.authUserId ?? null;

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (alive) setMyAuthId(data.user?.id ?? null);
    });
    return () => {
      alive = false;
    };
  }, []);

  // forget the previous conversation the moment the peer changes so the new
  // thread never renders (or scroll-measures) another person's messages
  useEffect(() => {
    setMessages([]);
  }, [otherAuthId]);

  useEffect(() => {
    if (!supabase || !myAuthId || !otherAuthId) return;
    let alive = true;
    const load = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .or(
          `and(sender_user_id.eq.${myAuthId},recipient_user_id.eq.${otherAuthId}),and(sender_user_id.eq.${otherAuthId},recipient_user_id.eq.${myAuthId})`
        )
        .order("sent_at", { ascending: true });
      if (!alive || error || !data) return;
      setMessages((data as DbChatRow[]).map(rowToMessage));
    };
    void load();
    const t = setInterval(load, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [myAuthId, otherAuthId]);

  const send = useCallback(
    async (author: Profile, body: string) => {
      if (!supabase || !myAuthId || !otherAuthId) return;
      const text = body.trim();
      if (!text) return;
      const optimistic: ChatMessage = {
        id: newId(),
        byId: author.id,
        bySenderAuthId: myAuthId,
        by: author.name,
        role: author.role,
        body: text,
        at: new Date().toISOString(),
        read: false,
      };
      setMessages((prev) => [...prev, optimistic]);
      const { error } = await supabase.from("chat_messages").insert({
        sender_user_id: myAuthId,
        recipient_user_id: otherAuthId,
        sender_profile_id: author.id,
        recipient_profile_id: peer.profileId,
        sender_name: author.name,
        sender_role: author.role,
        body: text,
      });
      if (error) {
        // rollback optimistic entry on failure so nothing lingers wrongly
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    },
    [myAuthId, otherAuthId, peer.profileId]
  );

  const markRead = useCallback(async () => {
    if (!supabase || !myAuthId || !otherAuthId) return;
    await supabase
      .from("chat_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_user_id", myAuthId)
      .eq("sender_user_id", otherAuthId)
      .is("read_at", null);
  }, [myAuthId, otherAuthId]);

  /** Update the body of one of my own messages. The `.eq("sender_user_id", ...)`
   *  filter — plus the RLS policy — guarantees you can only edit your own.
   *  RLS-blocked updates return NO error, just 0 rows — so we require the
   *  updated row back (.select) and roll the optimistic change back on failure. */
  const edit = useCallback(
    async (msgId: string, newBody: string): Promise<boolean> => {
      if (!supabase || !myAuthId) return false;
      const body = newBody.trim();
      if (!body) return false;
      const editedAt = new Date().toISOString();
      // optimistic update so the UI feels instant (keep the old value for rollback)
      let old: { body: string; editedAt?: string } | null = null;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId) return m;
          old = { body: m.body, editedAt: m.editedAt };
          return { ...m, body, editedAt };
        })
      );
      const { data, error } = await supabase
        .from("chat_messages")
        .update({ body, edited_at: editedAt })
        .eq("id", msgId)
        .eq("sender_user_id", myAuthId)
        .select("id");
      const ok = !error && !!data && data.length > 0;
      if (!ok && old) {
        const o = old as { body: string; editedAt?: string };
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, body: o.body, editedAt: o.editedAt } : m))
        );
      }
      return ok;
    },
    [myAuthId]
  );

  /** React to a message the other person sent me (👍 / ❤️ — null clears it).
   *  Only the recipient may react, enforced by the `.eq("recipient_user_id")`
   *  filter plus RLS. Like `edit`, a blocked update returns 0 rows, no error —
   *  so we require the row back and roll the optimistic change back on failure. */
  const react = useCallback(
    async (msgId: string, reaction: string | null): Promise<boolean> => {
      if (!supabase || !myAuthId) return false;
      let old: string | undefined;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId) return m;
          old = m.reaction;
          return { ...m, reaction: reaction ?? undefined };
        })
      );
      const { data, error } = await supabase
        .from("chat_messages")
        .update({ reaction })
        .eq("id", msgId)
        .eq("recipient_user_id", myAuthId)
        .select("id");
      const ok = !error && !!data && data.length > 0;
      if (!ok) {
        const o = old;
        setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, reaction: o } : m)));
      }
      return ok;
    },
    [myAuthId]
  );

  return { messages, send, markRead, edit, react };
}

/** Delete every message in a thread. RLS ensures only the super user (admin)
 *  can wipe an entire conversation; ordinary senders can only delete their
 *  own individual messages. Returns true on success. */
export async function deleteChatThread(messageIds: string[]): Promise<boolean> {
  if (!supabase || messageIds.length === 0) return true;
  const { error } = await supabase.from("chat_messages").delete().in("id", messageIds);
  return !error;
}

/**
 * Broadcast the same message to a list of recipients — one direct-message row
 * per recipient, so RLS still privately delivers each copy. Returns the count
 * of successful deliveries.
 */
export async function broadcastChatMessage(
  sender: Profile,
  senderAuthId: string,
  recipients: { profileId: string; authUserId: string }[],
  body: string
): Promise<number> {
  if (!supabase) return 0;
  const text = body.trim();
  if (!text) return 0;
  const rows = recipients.map((r) => ({
    sender_user_id: senderAuthId,
    recipient_user_id: r.authUserId,
    sender_profile_id: sender.id,
    recipient_profile_id: r.profileId,
    sender_name: sender.name,
    sender_role: sender.role,
    body: text,
  }));
  if (rows.length === 0) return 0;
  const { error } = await supabase.from("chat_messages").insert(rows);
  return error ? 0 : rows.length;
}

/** Summary of a single chat thread — for listing conversations in a sidebar. */
export interface ChatThreadInfo {
  /** grouping key: sorted "profileA~~profileB" so both sides use the same value */
  key: string;
  aId: string;
  bId: string;
  messages: ChatMessage[];
  latest?: ChatMessage;
  /** how many messages the given profile has *not* read yet */
  unreadFor: (profileId: string) => number;
}

/**
 * Subscribe to every chat thread the current viewer may see.
 *  - a normal user sees threads they are a participant in (RLS filters rows).
 *  - a super user sees every conversation (admin RLS policy).
 * The hook groups the visible messages by profile-pair so the UI can list
 * conversations.
 */
export function useChatThreads(): ChatThreadInfo[] {
  const [threads, setThreads] = useState<ChatThreadInfo[]>([]);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    const load = async () => {
      if (!supabase) return;
      // RLS handles who can see which row.
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("sent_at", { ascending: true });
      if (!alive || error || !data) return;
      const grouped = new Map<string, ChatMessage[]>();
      const pair = new Map<string, { aId: string; bId: string }>();
      for (const row of data as DbChatRow[]) {
        const [aId, bId] =
          row.sender_profile_id < row.recipient_profile_id
            ? [row.sender_profile_id, row.recipient_profile_id]
            : [row.recipient_profile_id, row.sender_profile_id];
        const key = chatPairKey(row.sender_profile_id, row.recipient_profile_id);
        if (!grouped.has(key)) {
          grouped.set(key, []);
          pair.set(key, { aId, bId });
        }
        grouped.get(key)!.push(rowToMessage(row));
      }
      const out: ChatThreadInfo[] = [];
      for (const [key, msgs] of grouped) {
        const { aId, bId } = pair.get(key)!;
        out.push({
          key,
          aId,
          bId,
          messages: msgs,
          latest: msgs[msgs.length - 1],
          // A message is unread for a given viewer if they were the recipient
          // (i.e. not the author) and it has not been marked read yet.
          unreadFor: (viewerProfileId: string) =>
            msgs.filter((m) => m.byId !== viewerProfileId && !m.read).length,
        });
      }
      out.sort((a, b) => (b.latest?.at ?? "").localeCompare(a.latest?.at ?? ""));
      setThreads(out);
    };
    void load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return threads;
}

/* ---------- POE reviews (assessor verdicts per evidence item) ---------- */

const POE_REVIEW_KEY = "itss.poereview.shared";

export type PoeReviewStatus = "competent" | "nyc";

export interface PoeReview {
  status: PoeReviewStatus;
  note?: string;
  byId: string;
  by: string;
  at: string;
}

/** learner profile id -> POE item id -> review */
export type PoeReviewMap = Record<string, Record<string, PoeReview>>;

export function usePoeReviews() {
  const [reviews, update] = useSharedState<PoeReviewMap>(POE_REVIEW_KEY, {});
  const setReview = useCallback(
    (reviewer: Profile, learnerId: string, itemId: string, status: PoeReviewStatus, note?: string) =>
      update((fresh) => ({
        ...fresh,
        [learnerId]: {
          ...fresh[learnerId],
          [itemId]: {
            status,
            ...(note?.trim() ? { note: note.trim() } : {}),
            byId: reviewer.id,
            by: reviewer.name,
            at: new Date().toISOString(),
          },
        },
      })),
    [update]
  );
  const clearReview = useCallback(
    (learnerId: string, itemId: string) =>
      update((fresh) => {
        const forLearner = { ...fresh[learnerId] };
        delete forLearner[itemId];
        return { ...fresh, [learnerId]: forLearner };
      }),
    [update]
  );
  return { reviews, setReview, clearReview };
}

/** Read POE reviews without subscribing (reports/exports). */
export function loadPoeReviews(): PoeReviewMap {
  return read<PoeReviewMap>(POE_REVIEW_KEY, {});
}

/* ---------- unit assessment outcomes (assessor records C / NYC) ---------- */

const OUTCOMES_KEY = "itss.outcomes.shared";

export type OutcomeStatus = "C" | "NYC";

export interface UnitOutcome {
  status: OutcomeStatus;
  note?: string;
  byId: string;
  by: string;
  at: string;
}

/** learner profile id -> unit standard -> outcome */
export type OutcomeMap = Record<string, Record<string, UnitOutcome>>;

export function useOutcomes() {
  const [outcomes, update] = useSharedState<OutcomeMap>(OUTCOMES_KEY, {});
  const setOutcome = useCallback(
    (assessor: Profile, learnerId: string, us: string, status: OutcomeStatus, note?: string) =>
      update((fresh) => ({
        ...fresh,
        [learnerId]: {
          ...fresh[learnerId],
          [us]: {
            status,
            ...(note?.trim() ? { note: note.trim() } : {}),
            byId: assessor.id,
            by: assessor.name,
            at: new Date().toISOString(),
          },
        },
      })),
    [update]
  );
  const clearOutcome = useCallback(
    (learnerId: string, us: string) =>
      update((fresh) => {
        const forLearner = { ...fresh[learnerId] };
        delete forLearner[us];
        return { ...fresh, [learnerId]: forLearner };
      }),
    [update]
  );
  return { outcomes, setOutcome, clearOutcome };
}

/** Read outcomes without subscribing (reports/certificates). */
export function loadOutcomes(): OutcomeMap {
  return read<OutcomeMap>(OUTCOMES_KEY, {});
}

/** Read a profile's Appendix C checklist without subscribing. */
export function loadChecklistTicks(profileId: string): Record<string, ChecklistTick> {
  return read<Record<string, ChecklistTick>>(`itss.checklist.${profileId}`, {});
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

/* POE checklist items -> the unit standards they evidence, parsed from labels
   like "Business reports written at work (US 8252)". */
const POE_ITEM_UNITS: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const s of POE_SECTIONS) {
    for (const it of s.items) {
      const units = [...it.label.matchAll(/US\s+(\d{4,6})/g)].map((m) => m[1]);
      if (units.length) map[it.id] = units;
    }
  }
  return map;
})();

/** Unit standards evidenced by an uploaded POE doc key ("we-reports" or "we-reports__2"). */
export function poeDocUnits(docKey: string): string[] {
  const base = docKey.split("__")[0];
  const mapped = POE_ITEM_UNITS[base];
  if (mapped && mapped.length) return mapped;
  // legacy "<us>__file" keys named the unit standard directly
  return /^\d{4,6}$/.test(base) ? [base] : [];
}

/** Set an activity flag when real evidence lands so completion reflects the
 *  work without the learner needing a separate manual tick. Safe no-op when
 *  the flag is already set. */
function creditActivityEvidence(profileId: string, us: string, activity: UnitActivity) {
  const key = progressKey(profileId);
  const prev = read<ProgressState>(key, EMPTY);
  const unit: UnitProgress = prev.units[us] ?? { activities: {} };
  if (unit.activities[activity]) return;
  const next: ProgressState = {
    ...prev,
    units: { ...prev.units, [us]: { ...unit, activities: { ...unit.activities, [activity]: true } } },
  };
  write(key, next);
  // let same-tab useProgress hooks re-read the fresh state
  try {
    window.dispatchEvent(new StorageEvent("storage", { key }));
  } catch {
    /* synthetic StorageEvent unsupported — cross-tab listeners still fire */
  }
}

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
      // uploading evidence credits the unit's "POE Evidence" activity
      for (const us of poeDocUnits(itemId)) {
        creditActivityEvidence(profileId, us, "POE Evidence");
      }
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

/** Course-wide fallback material: every facilitator upload across all unit
 *  standards, deduped by name+size. Units without their own uploads show
 *  these shared decks so common files (course overview, learner manual)
 *  don't have to be re-uploaded on each unit standard. */
export function readCourseWideSlides(exceptUs?: string): PoeDoc[] {
  const out: PoeDoc[] = [];
  const seen = new Set<string>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("itss.planslides.")) continue;
      if (exceptUs && key === planSlidesKey(exceptUs)) continue;
      for (const doc of read<PoeDoc[]>(key, [])) {
        if (!doc || !doc.name) continue;
        const id = `${doc.name}|${doc.size}`;
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(doc);
      }
    }
  } catch {
    /* storage unavailable — no fallback material */
  }
  return out.sort((a, b) => (a.uploadedAt ?? "").localeCompare(b.uploadedAt ?? ""));
}

/* ---------- staff replacements for built-in lesson decks (shared) ---------- */

const deckOverridesKey = (us: string) => `itss.deckoverrides.${us}`;

/** Staff-uploaded replacements for the app's built-in slide decks, keyed by
 *  the built-in deck's static URL. Shared with every account. */
export function useDeckOverrides(us: string) {
  const [overrides, setOverrides] = useState<Record<string, PoeDoc>>(() =>
    read<Record<string, PoeDoc>>(deckOverridesKey(us), {})
  );

  useEffect(() => {
    setOverrides(read<Record<string, PoeDoc>>(deckOverridesKey(us), {}));
  }, [us]);

  const setOverride = useCallback(
    (deckUrl: string, doc: PoeDoc): boolean => {
      const next = { ...read<Record<string, PoeDoc>>(deckOverridesKey(us), {}), [deckUrl]: doc };
      try {
        write(deckOverridesKey(us), next);
      } catch {
        return false; // storage quota exceeded
      }
      setOverrides(next);
      return true;
    },
    [us]
  );

  const clearOverride = useCallback(
    (deckUrl: string) => {
      const fresh = read<Record<string, PoeDoc>>(deckOverridesKey(us), {});
      const doomed = fresh[deckUrl];
      const next = { ...fresh };
      delete next[deckUrl];
      write(deckOverridesKey(us), next);
      setOverrides(next);
      if (doomed?.path) void import("./lib/files").then((m) => m.deleteFile(doomed.path));
    },
    [us]
  );

  return { overrides, setOverride, clearOverride };
}

/* ---------- staff-uploaded lesson figures (shared per unit standard) ---------- */

export interface LessonFigureImage {
  /** data-URL of the uploaded picture (local-only mode / not yet migrated) */
  image?: string;
  /** Supabase Storage path of the uploaded picture (cloud mode) */
  path?: string;
  uploadedAt: string;
}

const lessonFigsKey = (us: string) => `itss.lessonfigs.${us}`;

/** signed-URL cache so figure images resolve once per path per session */
const figUrlCache = new Map<string, { url: string; exp: number }>();
const FIG_URL_TTL_S = 7 * 24 * 3600; // signed URL lifetime
const FIG_URL_FRESH_MS = 6 * 24 * 3600 * 1000; // renew a day before expiry

async function signedFigUrl(path: string): Promise<string | null> {
  const hit = figUrlCache.get(path);
  if (hit && hit.exp > Date.now()) return hit.url;
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from("files").createSignedUrl(path, FIG_URL_TTL_S);
  if (error || !data) return null;
  figUrlCache.set(path, { url: data.signedUrl, exp: Date.now() + FIG_URL_FRESH_MS });
  return data.signedUrl;
}

/** Upload a figure data-URL to Supabase Storage; returns the storage path. */
async function uploadFigure(us: string, id: string, dataUrl: string): Promise<string> {
  if (!supabase) throw new Error("cloud sync not configured");
  const blob = await (await fetch(dataUrl)).blob();
  const safeId = id.replace(/[^\w.\-]+/g, "_");
  const path = `shared/lessonfigs/${us}/${safeId}-${Date.now().toString(36)}.jpg`;
  const { error } = await supabase.storage
    .from("files")
    .upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg" });
  if (error) throw error;
  return path;
}

export function useLessonFigures(us: string) {
  const [figures, setFigures] = useState<Record<string, LessonFigureImage>>(() =>
    read<Record<string, LessonFigureImage>>(lessonFigsKey(us), {})
  );
  /** figure id -> resolved signed URL for path-based entries */
  const [figUrls, setFigUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    setFigures(read<Record<string, LessonFigureImage>>(lessonFigsKey(us), {}));
  }, [us]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === lessonFigsKey(us)) {
        setFigures(read<Record<string, LessonFigureImage>>(lessonFigsKey(us), {}));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [us]);

  // resolve signed URLs for cloud-stored figures
  useEffect(() => {
    let alive = true;
    const need = Object.entries(figures).filter(([, f]) => f.path && !f.image);
    if (!need.length) return;
    void (async () => {
      const resolved: Record<string, string> = {};
      await Promise.all(
        need.map(async ([id, f]) => {
          const url = await signedFigUrl(f.path!);
          if (url) resolved[id] = url;
        })
      );
      if (alive && Object.keys(resolved).length) setFigUrls((u) => ({ ...u, ...resolved }));
    })();
    return () => {
      alive = false;
    };
  }, [figures]);

  /** figures with `image` always usable as an <img> src (data-URL or signed URL) */
  const merged = useMemo(() => {
    const out: Record<string, LessonFigureImage> = {};
    for (const [id, f] of Object.entries(figures)) {
      out[id] = f.image ? f : { ...f, image: figUrls[id] };
    }
    return out;
  }, [figures, figUrls]);

  const setFigure = useCallback(
    async (id: string, image: string): Promise<boolean> => {
      const fresh = read<Record<string, LessonFigureImage>>(lessonFigsKey(us), {});
      const uploadedAt = new Date().toISOString();
      if (supabase) {
        try {
          const path = await uploadFigure(us, id, image);
          const next: Record<string, LessonFigureImage> = { ...fresh, [id]: { path, uploadedAt } };
          // the replaced upload (if any) is no longer referenced — clean it up
          const oldPath = fresh[id]?.path;
          if (oldPath && oldPath !== path) {
            void supabase.storage.from("files").remove([oldPath]).catch(() => {});
          }
          // migrate any legacy inline data-URL figures of this unit to storage,
          // shrinking localStorage/shared-state far below the browser quota
          for (const [fid, f] of Object.entries(next)) {
            if (fid === id || !f.image || !f.image.startsWith("data:")) continue;
            try {
              const migrated = await uploadFigure(us, fid, f.image);
              next[fid] = { path: migrated, uploadedAt: f.uploadedAt };
            } catch {
              break; // keep remaining inline images; retry on a later upload
            }
          }
          write(lessonFigsKey(us), next);
          setFigures(next);
          return true;
        } catch {
          return false; // upload failed (offline / permissions)
        }
      }
      // local-only mode: keep the picture inline in localStorage
      const next = { ...fresh, [id]: { image, uploadedAt } };
      try {
        write(lessonFigsKey(us), next);
      } catch {
        return false; // storage quota exceeded
      }
      setFigures(next);
      return true;
    },
    [us]
  );

  const removeFigure = useCallback(
    (id: string) => {
      const fresh = read<Record<string, LessonFigureImage>>(lessonFigsKey(us), {});
      const doomed = fresh[id]?.path;
      if (doomed && supabase) {
        void supabase.storage.from("files").remove([doomed]).catch(() => {});
      }
      const next = { ...fresh };
      delete next[id];
      write(lessonFigsKey(us), next);
      setFigures(next);
    },
    [us]
  );

  return { figures: merged, setFigure, removeFigure };
}

/* ---------- class memories photo wall (shared with everyone) ---------- */

export interface MemoryPhoto {
  id: string;
  /** Supabase Storage path (cloud mode) */
  path?: string;
  /** inline data-URL (local-only mode) */
  image?: string;
  /** uploader display name */
  by: string;
  /** uploader profile id — owners may remove their own photos */
  byId: string;
  uploadedAt: string;
}

const MEMORIES_KEY = "itss.memories.shared";

/** Fetch the freshest shared photo list from the cloud (null when offline/local). */
async function pullMemories(): Promise<MemoryPhoto[] | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from("shared_state")
      .select("value")
      .eq("key", MEMORIES_KEY)
      .maybeSingle();
    if (data?.value) {
      const list = JSON.parse(data.value) as MemoryPhoto[];
      return Array.isArray(list) ? list : [];
    }
    return [];
  } catch {
    return null; // offline — caller falls back to the local copy
  }
}

export function useMemories() {
  const [photos, setPhotos] = useState<MemoryPhoto[]>(() => read<MemoryPhoto[]>(MEMORIES_KEY, []));
  /** photo id -> resolved signed URL for cloud-stored photos */
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === MEMORIES_KEY) setPhotos(read<MemoryPhoto[]>(MEMORIES_KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // freshen from the cloud on mount so classmates' photos appear without a re-login
  useEffect(() => {
    void (async () => {
      const cloud = await pullMemories();
      if (cloud) {
        write(MEMORIES_KEY, cloud);
        setPhotos(cloud);
      }
    })();
  }, []);

  // resolve signed URLs for cloud-stored photos
  useEffect(() => {
    let alive = true;
    const need = photos.filter((p) => p.path && !p.image);
    if (!need.length) return;
    void (async () => {
      const got: Record<string, string> = {};
      await Promise.all(
        need.map(async (p) => {
          const u = await signedFigUrl(p.path!);
          if (u) got[p.id] = u;
        })
      );
      if (alive && Object.keys(got).length) setUrls((x) => ({ ...x, ...got }));
    })();
    return () => {
      alive = false;
    };
  }, [photos]);

  /** Add downscaled JPEG data-URLs; returns how many photos were saved. */
  const addPhotos = useCallback(async (who: Pick<Profile, "id" | "name">, images: string[]): Promise<number> => {
    // start from the freshest shared list so other devices' photos are kept
    const base = (await pullMemories()) ?? read<MemoryPhoto[]>(MEMORIES_KEY, []);
    const added: MemoryPhoto[] = [];
    for (const image of images) {
      const id = newId();
      const uploadedAt = new Date().toISOString();
      if (supabase) {
        try {
          const blob = await (await fetch(image)).blob();
          const path = `shared/memories/${id}.jpg`;
          const { error } = await supabase.storage
            .from("files")
            .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
          if (error) throw error;
          added.push({ id, path, by: who.name, byId: who.id, uploadedAt });
        } catch {
          // skip this photo (offline / permissions) — count reflects successes
        }
        continue;
      }
      added.push({ id, image, by: who.name, byId: who.id, uploadedAt });
    }
    if (added.length) {
      const next = [...base, ...added];
      try {
        write(MEMORIES_KEY, next);
      } catch {
        return 0; // local-only quota exceeded
      }
      setPhotos(next);
      void flushKey(MEMORIES_KEY);
    }
    return added.length;
  }, []);

  const removePhoto = useCallback(async (id: string) => {
    const base = (await pullMemories()) ?? read<MemoryPhoto[]>(MEMORIES_KEY, []);
    const doomed = base.find((p) => p.id === id);
    if (doomed?.path && supabase) {
      void supabase.storage.from("files").remove([doomed.path]).catch(() => {});
    }
    const next = base.filter((p) => p.id !== id);
    write(MEMORIES_KEY, next);
    setPhotos(next);
    void flushKey(MEMORIES_KEY);
  }, []);

  return { photos, urls, addPhotos, removePhoto };
}

/* ---------- super-user lesson edits (per unit, saved locally) ---------- */

export interface LessonEdits {
  /** section index -> replacement heading */
  headings?: Record<number, string>;
  /** `${sectionIdx}:${paraIdx}` -> replacement paragraph text */
  paragraphs?: Record<string, string>;
  /** `${sectionIdx}:${bulletIdx}` -> replacement bullet text */
  bullets?: Record<string, string>;
  /** `${sectionIdx}:${cardIdx}:t` (title) / `:d` (text) -> replacement card content */
  cards?: Record<string, string>;
  /** `${sectionIdx}:${exIdx}:t` (title) / `${sectionIdx}:${exIdx}:${lineIdx}` -> example content */
  examples?: Record<string, string>;
  /** `${sectionIdx}:h:${colIdx}` (header) / `${sectionIdx}:${rowIdx}:${colIdx}` -> table cell */
  tableCells?: Record<string, string>;
  /** figure id -> replacement caption */
  captions?: Record<string, string>;
  /** section index -> ordered list of figure ids (unknown ids preserved after) */
  figureOrder?: Record<number, string[]>;
  /** figure id -> scale multiplier, 0.5..1.4 */
  figureScale?: Record<string, number>;
  /** figure id -> vertical crop position 0..100 (percent, 50 = centre) */
  figureOffsetY?: Record<string, number>;
}

const lessonEditsKey = (us: string) => `itss.lessonedits.${us}`;

export function useLessonEdits(us: string) {
  const [edits, setEditsState] = useState<LessonEdits>(() => read<LessonEdits>(lessonEditsKey(us), {}));

  useEffect(() => {
    setEditsState(read<LessonEdits>(lessonEditsKey(us), {}));
  }, [us]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === lessonEditsKey(us)) setEditsState(read<LessonEdits>(lessonEditsKey(us), {}));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [us]);

  const apply = useCallback(
    (mutate: (draft: LessonEdits) => LessonEdits) => {
      const fresh = read<LessonEdits>(lessonEditsKey(us), {});
      const next = mutate({ ...fresh });
      write(lessonEditsKey(us), next);
      setEditsState(next);
    },
    [us]
  );

  const setHeading = useCallback(
    (sIdx: number, text: string) =>
      apply((d) => {
        const headings = { ...(d.headings ?? {}) };
        if (text.trim()) headings[sIdx] = text; else delete headings[sIdx];
        return { ...d, headings };
      }),
    [apply]
  );

  const setParagraph = useCallback(
    (sIdx: number, pIdx: number, text: string) =>
      apply((d) => {
        const paragraphs = { ...(d.paragraphs ?? {}) };
        const key = `${sIdx}:${pIdx}`;
        if (text.trim()) paragraphs[key] = text; else delete paragraphs[key];
        return { ...d, paragraphs };
      }),
    [apply]
  );

  const setCaption = useCallback(
    (figId: string, text: string) =>
      apply((d) => {
        const captions = { ...(d.captions ?? {}) };
        if (text.trim()) captions[figId] = text; else delete captions[figId];
        return { ...d, captions };
      }),
    [apply]
  );

  /** generic keyed-text setter for bullets / cards / examples / table cells */
  const setKeyed = useCallback(
    (field: "bullets" | "cards" | "examples" | "tableCells", key: string, text: string) =>
      apply((d) => {
        const map = { ...(d[field] ?? {}) };
        if (text.trim()) map[key] = text; else delete map[key];
        return { ...d, [field]: map };
      }),
    [apply]
  );

  const moveFigure = useCallback(
    (sIdx: number, allIds: string[], figId: string, dir: -1 | 1) =>
      apply((d) => {
        const orders = { ...(d.figureOrder ?? {}) };
        const current = (orders[sIdx] && orders[sIdx].length ? orders[sIdx] : allIds).slice();
        // ensure every known id is present
        for (const id of allIds) if (!current.includes(id)) current.push(id);
        const idx = current.indexOf(figId);
        const swap = idx + dir;
        if (idx >= 0 && swap >= 0 && swap < current.length) {
          [current[idx], current[swap]] = [current[swap], current[idx]];
          orders[sIdx] = current;
        }
        return { ...d, figureOrder: orders };
      }),
    [apply]
  );

  const setScale = useCallback(
    (figId: string, scale: number) =>
      apply((d) => {
        const figureScale = { ...(d.figureScale ?? {}) };
        const clamped = Math.max(0.5, Math.min(1.4, Math.round(scale * 10) / 10));
        if (Math.abs(clamped - 1) < 0.001) delete figureScale[figId];
        else figureScale[figId] = clamped;
        return { ...d, figureScale };
      }),
    [apply]
  );

  const setOffsetY = useCallback(
    (figId: string, pct: number) =>
      apply((d) => {
        const figureOffsetY = { ...(d.figureOffsetY ?? {}) };
        const clamped = Math.max(0, Math.min(100, Math.round(pct)));
        if (clamped === 50) delete figureOffsetY[figId];
        else figureOffsetY[figId] = clamped;
        return { ...d, figureOffsetY };
      }),
    [apply]
  );

  const resetSection = useCallback(
    (sIdx: number, figIds: string[]) =>
      apply((d) => {
        const headings = { ...(d.headings ?? {}) };
        delete headings[sIdx];
        const scrub = (map?: Record<string, string>) => {
          const next = { ...(map ?? {}) };
          for (const k of Object.keys(next)) if (k.startsWith(`${sIdx}:`)) delete next[k];
          return next;
        };
        const paragraphs = scrub(d.paragraphs);
        const bullets = scrub(d.bullets);
        const cards = scrub(d.cards);
        const examples = scrub(d.examples);
        const tableCells = scrub(d.tableCells);
        const figureOrder = { ...(d.figureOrder ?? {}) };
        delete figureOrder[sIdx];
        const captions = { ...(d.captions ?? {}) };
        const figureScale = { ...(d.figureScale ?? {}) };
        for (const id of figIds) {
          delete captions[id];
          delete figureScale[id];
        }
        const figureOffsetY = { ...(d.figureOffsetY ?? {}) };
        for (const id of figIds) delete figureOffsetY[id];
        return { ...d, headings, paragraphs, bullets, cards, examples, tableCells, figureOrder, captions, figureScale, figureOffsetY };
      }),
    [apply]
  );

  return { edits, setHeading, setParagraph, setCaption, setKeyed, moveFigure, setScale, setOffsetY, resetSection };
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

/**
 * Like {@link unitCompletion} but also credits activities that have real
 * supporting evidence even when the learner never ticked the checkbox:
 *  • "Formative Assessment" — done if any quiz has been taken or any
 *     exercise / question session answered (quizzes are formative).
 *  • "Summative Assessment" — only counted when explicitly flagged (the
 *     formal summative event is recorded by staff, not by app evidence).
 *  • "POE Evidence" — done if any POE document has been uploaded for this
 *     unit standard.
 *  • "Lesson & Training Aids" — only counted when explicitly flagged
 *     (auto-set when the learner finishes the lesson slides).
 * Use this for staff-side progress views so a learner who has done all the
 * marked work but not clicked "Mark complete" no longer reads as 0%.
 */
export function unitProgress(
  state: ProgressState,
  us: string,
  poe: Record<string, PoeDoc> = {}
): number {
  const p = state.units[us];
  const activities = p?.activities ?? {};
  const quizzes = p?.quizzes ?? {};
  const quiz = p?.quiz;
  const exercises = p?.exercises ?? {};
  const anyQuizAttempted =
    !!(quiz && quiz.total) ||
    Object.values(quizzes).some((q) => q.total > 0);
  const anyExerciseAttempted = Object.values(exercises).some((e) => e.total > 0);
  const anyPoeForUnit = Object.keys(poe).some((k) => poeDocUnits(k).includes(us));
  const done = UNIT_ACTIVITIES.filter((a) => {
    if (activities[a]) return true;
    if (a === "Formative Assessment" && (anyQuizAttempted || anyExerciseAttempted)) return true;
    if (a === "POE Evidence" && anyPoeForUnit) return true;
    return false;
  }).length;
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

export function overallStats(
  state: ProgressState,
  poe: Record<string, PoeDoc> = {},
  /** the learner's assessor-recorded unit outcomes — credits count ONLY for
   *  units an assessor has marked Competent ("C"); learners cannot award
   *  themselves credits by ticking their own activity stages. */
  assessed: Record<string, UnitOutcome> = {}
) {
  let unitsCompleted = 0;
  let unitsInProgress = 0;
  let creditsEarned = 0;
  let completionSum = 0;
  let total = 0;
  for (const m of MODULES) {
    for (const u of m.units) {
      total++;
      // "Progress" reflects real work done (quiz taken, POE uploaded, etc.)
      // even when the learner never ticked "Mark complete" — a friendlier
      // rollup for the staff-side compliance view.
      const p = unitProgress(state, u.us, poe);
      completionSum += p;
      const c = unitCompletion(state, u.us);
      if (c === 1) {
        unitsCompleted++;
      } else if (p > 0) {
        unitsInProgress++;
      }
      // SAQA credits accrue at exactly one auditable moment: a registered
      // assessor recording Competent for the unit on the learner's profile.
      if (assessed[u.us]?.status === "C") creditsEarned += u.credits;
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
