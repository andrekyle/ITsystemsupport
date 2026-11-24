import { MIN_ATTENDANCE_REGISTER_LEARNERS } from "./attendanceEvidence";
import type { ClientAttendanceRegister, ClientLearner } from "./clientPortal";

export function clientLearnerSigned(register: ClientAttendanceRegister, learner: ClientLearner) {
  if (register.rows[learner.learner_ref]) return true;
  const wanted = learner.name.trim().toLowerCase();
  return Object.values(register.rows).some(row =>
    `${row.name ?? ''} ${row.surname ?? ''}`.trim().toLowerCase() === wanted
  );
}

export function clientLearnerAttendanceStartDate(
  learner: ClientLearner,
  registers: ClientAttendanceRegister[],
): string | null {
  const firstSignedDate = registers
    .filter(register =>
      register.signer_count >= MIN_ATTENDANCE_REGISTER_LEARNERS &&
      clientLearnerSigned(register, learner)
    )
    .map(register => register.date)
    .sort()[0];
  return firstSignedDate ?? learner.start_date;
}

export function clientLearnerEnrolledForRegister(
  registerDate: string,
  learner: ClientLearner,
  attendanceStartDate: string | null,
) {
  if (attendanceStartDate && registerDate < attendanceStartDate) return false;
  if (learner.end_date && registerDate > learner.end_date) return false;
  return true;
}
