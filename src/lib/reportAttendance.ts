export interface LearnerAttendanceRecord {
  name: string;
  firstSession: string | null;
  sessionsAttended: number;
  sessionsExpected: number;
  absences: number;
  attendanceRatePct: number | null;
  sessions: { date: string; status: "Present" | "Absent" }[];
}

interface AttendanceLearnerInput {
  id: string;
  name: string;
  signedDates: string[];
}

interface AttendanceSessionInput {
  date: string;
  signedProfileIds: string[];
}

export function buildLearnerAttendanceRecords(
  learners: AttendanceLearnerInput[],
  sessions: AttendanceSessionInput[]
): (LearnerAttendanceRecord & { profileId: string })[] {
  const sortedSessions = [...new Map(sessions.map((session) => [session.date, session])).values()]
    .sort((a, b) => a.date.localeCompare(b.date));
  return learners.map((learner) => {
    const signedDates = new Set(learner.signedDates);
    for (const session of sortedSessions) {
      if (session.signedProfileIds.includes(learner.id)) signedDates.add(session.date);
    }
    const firstSession = [...signedDates].sort()[0] ?? null;
    const learnerSessions = sortedSessions
      .filter((session) => !firstSession || session.date >= firstSession)
      .map((session) => ({
        date: session.date,
        status: signedDates.has(session.date) ? "Present" as const : "Absent" as const,
      }));
    const sessionsAttended = learnerSessions.filter((session) => session.status === "Present").length;
    const sessionsExpected = learnerSessions.length;
    const absences = sessionsExpected - sessionsAttended;
    return {
      profileId: learner.id,
      name: learner.name,
      firstSession,
      sessionsAttended,
      sessionsExpected,
      absences,
      attendanceRatePct: sessionsExpected ? Math.round((sessionsAttended / sessionsExpected) * 100) : null,
      sessions: learnerSessions,
    };
  });
}

type AttendanceHistoryEntry = { role?: string; content?: string };

function mentionsName(text: string, name: string): boolean {
  const aliases = [name, name.trim().split(/\s+/)[0]].filter(Boolean);
  return aliases.some((alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i").test(text);
  });
}

export function deterministicAttendanceAnswer(
  question: string,
  history: AttendanceHistoryEntry[],
  records: LearnerAttendanceRecord[]
): string | null {
  const trimmedQuestion = question.trim();
  const isShowMeFollowUp =
    /^(?:please\s+)?(?:show me|which dates|what dates|list them|list it|more details)\b/i.test(trimmedQuestion);
  const latestAssistant = [...history].reverse().find((message) => message.role === "assistant")?.content ?? "";
  const followUpIsAttendance = isShowMeFollowUp &&
    /\b(attendance|registers?|absen(?:t|ce|ces)?|miss(?:ed|ing)?|sessions?)\b/i.test(latestAssistant);
  const asksAboutAttendance = /\b(attendance|registers?|absen(?:t|ce|ces)?|miss(?:ed|ing)?|sessions?|present|signed)\b/i.test(trimmedQuestion);
  if (!asksAboutAttendance && !followUpIsAttendance) return null;
  if (/\b(?:why|reason|explain|cause)\b/i.test(trimmedQuestion)) return null;
  if (
    /\b(?:this|last|previous|past|current)\s+(?:month|week|year|term|period|session|class)\b|\b(?:between|since|before|after|today|yesterday)\b/i.test(trimmedQuestion) ||
    /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(trimmedQuestion) ||
    /\b(?:in|during|for)\s+20\d{2}\b/i.test(trimmedQuestion)
  ) {
    return null;
  }

  const messages = [trimmedQuestion, ...[...history].reverse().map((message) => message.content ?? "")];
  const mentioned = messages
    .map((message) => records.filter((record) => mentionsName(message, record.name)))
    .find((matches) => matches.length > 0);
  if (!mentioned || mentioned.length !== 1) return null;

  const record = mentioned[0];
  const sessionsAttended = record.sessions.filter((session) => session.status === "Present").length;
  const sessionsExpected = record.sessions.length;
  const absences = sessionsExpected - sessionsAttended;
  const attendanceRatePct = sessionsExpected ? Math.round((sessionsAttended / sessionsExpected) * 100) : null;
  if (!sessionsExpected) return null;
  const date = trimmedQuestion.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  if (date) {
    const session = record.sessions.find((item) => item.date === date);
    return session ? `On ${date}, ${record.name} was marked ${session.status.toLowerCase()}.` : null;
  }

  const asksForRate = /\b(rate|percentage|percent)\b/i.test(trimmedQuestion);
  const asksForCount = /\b(how many|count|number of|total)\b/i.test(trimmedQuestion);
  const asksForDetails = /\b(show|list|which|dates|table|details?)\b/i.test(trimmedQuestion) || followUpIsAttendance;
  if (!asksForRate && !asksForCount && !asksForDetails) return null;
  const asksForAttendanceCount = asksForCount &&
    /\b(attend(?:ed|ance)?|present|signed)\b/i.test(trimmedQuestion) &&
    !/\b(absen(?:t|ce|ces)?|missed)\b/i.test(trimmedQuestion);
  if (asksForAttendanceCount) {
    return `${record.name} attended ${sessionsAttended} of ${sessionsExpected} expected sessions.`;
  }
  const summary = `${record.name} was absent for ${absences} of ${sessionsExpected} expected sessions.`;
  if (asksForRate) {
    return `${record.name}'s attendance rate was ${attendanceRatePct}% (${sessionsAttended} of ${sessionsExpected} expected sessions).`;
  }
  if (asksForDetails) {
    const table = [
      "| Date | Status |",
      "| --- | --- |",
      ...record.sessions.map((session) => `| ${session.date} | ${session.status} |`),
    ].join("\n");
    return `${summary}\n\n${table}`;
  }
  return summary;
}
