import type { Role } from "../types";

/** The account role that owns a labelled signature field. Unqualified
 * signature lines in learner documents belong to the learner. */
export function signatureFieldRole(label: string): Role | null {
  const normalized = label.toLowerCase();
  if (/\bmoderator\b/.test(normalized)) return "Moderator";
  if (/\bassessor\b/.test(normalized)) return "Assessor";
  if (/\b(?:facilitator|trainer)\b/.test(normalized)) return "Facilitator";
  if (/\b(?:learner|student)\b/.test(normalized)) return "Learner";
  if (/\b(?:supervisor|manager|mentor|witness)\b/.test(normalized)) return null;
  return "Learner";
}

export function canSignDocumentField(role: Role, label: string): boolean {
  return signatureFieldRole(label) === role;
}
