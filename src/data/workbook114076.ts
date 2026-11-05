import type { WorkbookSpec } from "../types";

/** Transcribed from public/downloads/US-114076-Learner-Workbook.pdf, pages 2-3 and 7-9. */
export const WORKBOOK_114076: WorkbookSpec = {
  title: "Use computer technology to research a computer topic",
  outcomes: [
    {
      id: "outcome-1", specificOutcome: 1, title: "Plan the research of a computer topic.",
      learningOutcomes: [
        "The plan identifies the topic, objectives, and scope of the research.",
        "The plan identifies the time to be taken for the research, the research methods to be used, and the sources of information to be used.",
        "The plan identifies the target audience, presentation methods, and the computer applications to be used for the analysis of data and the presentation of the results of the research.",
      ],
      questions: [{ id: "activity-1", task: 1, sourceLabel: "Activity 1 · 1.1", text: "In pairs outline how you would plan the research of a computer topic", marks: 10 }],
    },
    {
      id: "outcome-2", specificOutcome: 2, title: "Conduct research of a computer topic using computer technology.",
      learningOutcomes: [
        "The research conducted accumulates data according to the research plan.",
        "The research conducted provides data analysis with conclusions.",
        "The description of the analysis methods allows the validity of the analysis to be assessed.",
        "Research progress is indicated at intervals by reports, according to the research plan.",
        "The research conducted uses a computer application to analyse the research data.",
      ],
      questions: [{ id: "activity-2", task: 2, sourceLabel: "Activity 2 · 1.1", text: "Describe Data Collection in computer science", marks: 6 }],
    },
    {
      id: "outcome-3", specificOutcome: 3, title: "Present the results of research of a computer topic using computer technology.",
      learningOutcomes: [
        "The presentation is made using the computer application identified in the research plan.",
        "The presentation communicates summarised research data and conclusions to the target audience.",
      ],
      questions: [
        { id: "activity-3-1", task: 3, sourceLabel: "Activity 3 · 1.1", text: "Define the following terms, Coding, Analytical Memos, Displays, Validity, Contextual and Narrative Analysis", marks: 10 },
        { id: "activity-3-2", task: 4, sourceLabel: "Activity 3 · 1.2", text: "What do you understand by Quantitative content analysis findings", marks: 6 },
      ],
    },
  ],
};
