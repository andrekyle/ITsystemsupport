import type { SelfAssessment } from "../types";

const RESEARCH_CHECKLIST = [
  "I can choose a clear computer-related research topic and define the question I will investigate.",
  "I can find and evaluate reliable information using computer technology.",
  "I can record relevant research findings and keep track of my sources.",
  "I can organise and analyse the information I collected.",
  "I can present my findings clearly and acknowledge the sources I used.",
];

/** Unit Standard 114076 uses exactly five self-assessment questions. */
export function fiveResearchSelfAssessment(assessment: SelfAssessment): SelfAssessment {
  const items = assessment.items.map(item => item.trim()).filter(Boolean).slice(0, 5);
  for (const fallback of RESEARCH_CHECKLIST) {
    if (items.length === 5) break;
    if (!items.includes(fallback)) items.push(fallback);
  }
  return { ...assessment, items };
}
