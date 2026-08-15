/**
 * Zero-secret integrations with Microsoft Teams, Outlook and calendar apps.
 *
 * Everything here is deep-link or file based (no API keys, no data leaves the
 * device), so it works in local-only mode and in any browser. Links open the
 * user's own signed-in Teams / Outlook.
 */

/* ---------- session date parsing ---------- */

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Parse a "09h00 - 14h00" style time window into [startH, startM, endH, endM]. */
function parseTimeWindow(time: string): [number, number, number, number] {
  const m = time.match(/(\d{1,2})h(\d{2})\s*[-–]\s*(\d{1,2})h(\d{2})/);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  return [9, 0, 14, 0];
}

export interface SessionDate {
  start: Date;
  end: Date;
  /** true when the source was a date range like "4 – 11 Jun 2027" */
  range?: boolean;
}

/**
 * Parse programme date strings into concrete sessions.
 * Handles: "24, 31 Jul 2026" · "18, 25 Jun, 2 Jul 2027" · "4 – 11 Jun 2027".
 */
export function parseSessionDates(dates: string, time: string): SessionDate[] {
  const yearMatch = dates.match(/\b(20\d{2})\b/);
  if (!yearMatch) return [];
  const year = Number(yearMatch[1]);
  const [sh, sm, eh, em] = parseTimeWindow(time);
  const out: SessionDate[] = [];

  // range: "4 – 11 Jun 2027" → one block from first day to last day
  const range = dates.match(/(\d{1,2})\s*[–-]\s*(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
  if (range) {
    const mon = MONTHS[range[3].toLowerCase()];
    out.push({
      start: new Date(year, mon, Number(range[1]), sh, sm),
      end: new Date(year, mon, Number(range[2]), eh, em),
      range: true,
    });
    return out;
  }

  // day lists, possibly across months: "18, 25 Jun, 2 Jul 2027"
  const seg = /(\d{1,2}(?:\s*,\s*\d{1,2})*)\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/gi;
  let m: RegExpExecArray | null;
  while ((m = seg.exec(dates))) {
    const mon = MONTHS[m[2].toLowerCase()];
    for (const d of m[1].split(",").map((s) => Number(s.trim()))) {
      if (!Number.isNaN(d)) {
        out.push({ start: new Date(year, mon, d, sh, sm), end: new Date(year, mon, d, eh, em) });
      }
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/* ---------- ICS calendar files (Outlook, Teams calendar, Google, Apple) ---------- */

export interface IcsEvent {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const icsStamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Build an RFC 5545 calendar file covering the given events. */
export function buildIcs(events: IcsEvent[], calendarName = "ITSS Learn"): string {
  const now = icsStamp(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ITSS Learn//LMS//EN",
    `X-WR-CALNAME:${icsEscape(calendarName)}`,
  ];
  events.forEach((e, i) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:itss-${now}-${i}@itss-learn`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsStamp(e.start)}`,
      `DTEND:${icsStamp(e.end)}`,
      `SUMMARY:${icsEscape(e.title)}`,
      ...(e.description ? [`DESCRIPTION:${icsEscape(e.description)}`] : []),
      ...(e.location ? [`LOCATION:${icsEscape(e.location)}`] : []),
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/** Download events as an .ics file that opens in Outlook / Teams calendar. */
export function downloadIcs(filename: string, events: IcsEvent[], calendarName?: string) {
  const blob = new Blob([buildIcs(events, calendarName)], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- Microsoft Teams deep links ---------- */

/** Open a 1:1 Teams chat with the given person (opens Teams app or web). */
export function teamsChatLink(email: string, message?: string): string {
  const params = new URLSearchParams({ users: email });
  if (message) params.set("message", message);
  return `https://teams.microsoft.com/l/chat/0/0?${params.toString()}`;
}

/* ---------- Outlook deep links ---------- */

/** Compose an email in Outlook on the web. */
export function outlookComposeLink(to: string, subject?: string, body?: string): string {
  const params = new URLSearchParams({ to });
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  return `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`;
}

/** Create a calendar event in Outlook on the web. */
export function outlookEventLink(e: IcsEvent): string {
  const iso = (d: Date) => d.toISOString();
  const params = new URLSearchParams({
    subject: e.title,
    startdt: iso(e.start),
    enddt: iso(e.end),
  });
  if (e.description) params.set("body", e.description);
  if (e.location) params.set("location", e.location);
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/** Plain mailto: link (default mail app, incl. desktop Outlook). */
export function mailtoLink(to: string, subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString();
  return `mailto:${to}${qs ? `?${qs}` : ""}`;
}
