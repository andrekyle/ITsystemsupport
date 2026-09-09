import { reportDocumentHtml, REPORT_KINDS } from "./src/lib/reports";
import type { LearnerRow } from "./src/pages/Analytics";
import type { Profile } from "./src/types";

localStorage.setItem("itss.attendance.2026-07-17", JSON.stringify({ rows: { a: 1, b: 1 } }));
localStorage.setItem("itss.attendance.2026-07-24", JSON.stringify({ rows: { a: 1 } }));
localStorage.setItem("itss.attendance.2026-08-05", JSON.stringify({ rows: { a: 1, b: 1 } }));

const mk = (id: string, name: string, idNum: string, st: Record<string, "C" | "SA" | "IP" | "NYS">, signed: string[]): LearnerRow =>
  ({
    profile: { id, name, role: "Learner", enrolment: { idNumber: idNum } } as unknown as Profile,
    completion: 0.55, unitsCompleted: 3, creditsEarned: 10, quizAvg: 0.86, quizzesTaken: 6,
    exerciseAvg: 0.8, poeDone: 4, attendance: signed.length, attendanceExpected: signed.length,
    attendanceRate: 1, lastLogin: new Date().toISOString(), daysSinceSeen: 0, xp: 100, level: 2,
    levelName: "Apprentice", atRisk: false, riskReasons: [], unitStatus: st, signedDates: signed,
  }) as LearnerRow;

const rows = [
  mk("a", "Anele Khanyile", "0410271117088", { "8252": "IP", "10135": "IP", "114050": "NYS", "114051": "C", "114055": "SA", "114046": "NYS" }, ["2026-07-17", "2026-07-24", "2026-08-05"]),
  mk("b", "Anethemba Stemele", "0601166115082", { "8252": "SA", "10135": "C", "114050": "IP", "114051": "NYS", "114055": "NYS", "114046": "NYS" }, ["2026-07-17", "2026-08-05"]),
  mk("c", "Bradley Adams", "0301015800083", { "8252": "C", "10135": "C", "114050": "SA", "114051": "IP", "114055": "NYS", "114046": "NYS" }, ["2026-08-05"]),
];

const kind = REPORT_KINDS.find((k) => k.id === "tracker")!;
const report = {
  intro: "The cohort is tracking well.",
  sections: [
    { heading: "Anele Khanyile", paragraphs: ["Anele brings energy to every session and her attendance is perfect."] },
    { heading: "Anethemba Stemele", paragraphs: ["Anethemba is thorough in everything he takes on."] },
    { heading: "Bradley Adams", paragraphs: ["Bradley has attended every session since starting."] },
  ],
  recommendations: [],
};

document.open();
document.write(reportDocumentHtml(kind, report, rows, 3, { name: "Andre Snell" } as unknown as Profile));
document.close();
