import { useEffect, useState } from "react";
import type { Profile } from "../types";

/**
 * Shared audit trail for compliance evidence.
 *
 * Every significant action (sign-ins, enrolments, uploads, marks, reviews,
 * account admin) is appended to a capped, shared `itss.audit.shared` log that
 * syncs to every staff device. Read-only in the UI; exportable as CSV.
 */

export type AuditType =
  | "auth.signin"
  | "auth.signout"
  | "account.create"
  | "account.password"
  | "account.role"
  | "account.delete"
  | "enrolment.saved"
  | "quiz.submit"
  | "exercise.submit"
  | "poe.upload"
  | "poe.remove"
  | "poe.review"
  | "outcome.set"
  | "attendance.sign"
  | "announce.post"
  | "qa.post";

export interface AuditEvent {
  id: string;
  /** ISO timestamp */
  at: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  type: AuditType;
  detail: string;
  targetId?: string;
  targetName?: string;
}

const AUDIT_KEY = "itss.audit.shared";
const MAX_EVENTS = 2000;

function readLog(): AuditEvent[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    const parsed = raw ? (JSON.parse(raw) as AuditEvent[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Append an event to the shared audit trail (newest first, capped). */
export function logAudit(
  actor: Pick<Profile, "id" | "name" | "role">,
  type: AuditType,
  detail: string,
  target?: { id: string; name: string }
) {
  try {
    const entry: AuditEvent = {
      id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      at: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      type,
      detail,
      ...(target ? { targetId: target.id, targetName: target.name } : {}),
    };
    const next = [entry, ...readLog()].slice(0, MAX_EVENTS);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(next));
  } catch {
    // auditing must never break the action being audited
  }
}

/** Read the audit trail without subscribing. */
export function loadAudit(): AuditEvent[] {
  return readLog();
}

/** Subscribe to the audit trail (staff compliance view). */
export function useAudit(): AuditEvent[] {
  const [events, setEvents] = useState<AuditEvent[]>(readLog);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === AUDIT_KEY) setEvents(readLog());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return events;
}

const csvCell = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;

/** Serialise audit events to CSV (for records / external audits). */
export function auditCsv(events: AuditEvent[]): string {
  const header = "Timestamp,Actor,Role,Event,Detail,Target";
  const rows = events.map((e) =>
    [
      csvCell(new Date(e.at).toLocaleString()),
      csvCell(e.actorName),
      csvCell(e.actorRole),
      csvCell(e.type),
      csvCell(e.detail),
      csvCell(e.targetName ?? ""),
    ].join(",")
  );
  return [header, ...rows].join("\r\n");
}

/** Trigger a browser download of a text file (CSV exports etc). */
export function downloadText(filename: string, content: string, mime = "text/csv") {
  const blob = new Blob(["\uFEFF" + content], { type: `${mime};charset=utf-8` });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
