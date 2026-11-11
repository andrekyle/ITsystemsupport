import type { WorkbookSpec } from "../types";

/** Structured learner workbook for US 8252, transcribed from the 16-page
 * source scan (SAQA-8252 Learner Workbook). Activity wording, marks and the
 * specific-outcome bullets are kept exactly as printed. */
export const WORKBOOK_8252: WorkbookSpec = {
  title: "Writing business reports in Retail/Wholesale practices",
  outcomes: [
    {
      id: "business-reports",
      specificOutcome: 1,
      title: "The demonstrated ability to make decisions and consider options when:",
      learningOutcomes: [
        "Relating the purpose and content of a range of reports to the information needs of business?",
        "Recognising appropriate information resources and organisational procedures for obtaining and distributing confidential information?",
        "Applying a range of techniques for compiling reports, ensuring content and format are appropriate to information requirements and that reporting deadlines are met?",
        "Liaising with relevant parties and verifying reported information is in accordance with requirements, compiling and distributing additional commentary/information where required",
      ],
      questions: [
        { id: "activity-1", task: 1, sourceLabel: "1", text: "Describe the structure of a report and the purpose and contents of each section", marks: 15 },
        { id: "activity-2", task: 2, sourceLabel: "2", text: "In groups obtain examples of Business Management Reports", marks: 5 },
        { id: "activity-3", task: 3, sourceLabel: "3", text: "In groups collect various Business and Financial Reports", marks: 5 },
        { id: "activity-4", task: 4, sourceLabel: "4", text: "Discuss the importance of business reports", marks: 5 },
      ],
    },
  ],
};
