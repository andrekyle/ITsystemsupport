import type { WorkbookMemoState } from "../store";

const detailedAnswers: Record<string, string> = {
  "activity-1": "Title page — identifies the report, author and date.\nAbstract — a summary of fewer than 200 words covering the problem, investigation method, findings and meaning.\nTable of contents — lists the report's major and minor sections.\nIntroduction — provides background, states the aim or purpose and outlines the report.\nMain body — presents what was investigated, found, interpreted and judged in a logical sequence with informative headings.\nConclusion — states what has been achieved and the significance of the findings.\nRecommendations — gives the action recommended from the conclusion.\nReferences — lists every source used.\nAppendices — contain supporting graphs, charts, tables or other data not included in the main body.",
  "activity-2": "An internal business report records an investigation or data collection for managers who must make a decision.\nA company accident report records what happened, causes, people involved and corrective action.\nAn annual report summarises performance, finances and activities for owners, members or stakeholders.\nA commission-of-enquiry report presents evidence, findings and conclusions for the requesting authority.\nA trade report provides information about a sector, market or trading activity.\nFor each example, identify what it reports on and who uses the information.",
  "activity-3": "Financial statements show income, expenditure, assets, liabilities, cash flow and performance.\nBoard reports summarise performance, risks, issues and decisions requiring governance attention.\nBudgets show planned income, expenditure and resource allocation.\nFlash reports provide a short, timely view of key figures or events.\nProposals present an action, justification, resources, costs and expected benefits.\nStrategic plans describe long-term objectives, priorities, actions and success measures.\nExplain what business information each report provides and how it is used.",
  "activity-4": "Business reports turn relevant information into a form the organisation can use.\nThey support planning, monitoring, problem solving and informed decisions.\nThey provide a formal written record of events, evidence, findings, decisions and recommendations.\nInformation must be accurate and verified, with facts distinguished from interpretation or opinion.\nContent, style and format must suit the intended audience.\nReports must be clear, concise and distributed to the correct people by the deadline so the organisation can act."
};

/** Baseline marking memo for the US 8252 learner workbook, generated from the
 * 8252 lesson content (report structure, types of reports, confidentiality and
 * verification). It enables AI marking out of the box; uploading the official
 * memo in the Memo tab replaces these criteria. */
export const WORKBOOK_MEMO_8252: WorkbookMemoState = {
  model: "Generated from the US 8252 lesson content (report structure, types of reports and business-report practice)",
  updatedAt: "2026-11-11T00:00:00.000Z",
  items: [
    {
      id: "business-reports",
      question: "Writing business reports in Retail/Wholesale practices — Activities 1 to 4",
      maxMarks: 30,
      tasks: [
        {
          id: "activity-1", task: 1, marks: 15,
          text: "Describe the structure of a report and the purpose and contents of each section",
          modelAnswer: "Title page — identifies the report, its author and its date. Abstract — in less than 200 words: the problem, how it was investigated, the findings and what they mean. Table of contents — lists the major and minor sections of the report. Introduction — sets the scene, gives background about the topic, states the aim/purpose of the investigation and outlines the body sections. Main body — organised in a logical sequence (what was investigated, found, interpreted and judged) with short informative headings and subheadings. Conclusion — what has been achieved and the significance of the findings and discussion. Recommendations — the course of action recommended following the conclusion. References — a list of all sources used. Appendices — graphs, charts, tables or other data used in the report but not included in the body.",
        },
        {
          id: "activity-2", task: 2, marks: 5,
          text: "In groups obtain examples of Business Management Reports",
          modelAnswer: "Genuine business management report examples such as an internal report on a business matter following an investigation or collection of data, a company report or Company Accident Report, an Annual Report by a Chairman or Treasurer, a report of a commission of enquiry or a trade report, with a note of what each reports on and who it is for.",
        },
        {
          id: "activity-3", task: 3, marks: 5,
          text: "In groups collect various Business and Financial Reports",
          modelAnswer: "A varied collection of business and financial reports such as financial statements/reports, board reports, budgets, flash reports, proposals and strategic plans, with a note of the business information each one provides.",
        },
        {
          id: "activity-4", task: 4, marks: 5,
          text: "Discuss the importance of business reports",
          modelAnswer: "Business reports relate information to the information needs of the business: they support decision-making, provide a formal written record, communicate verified and accurate information to the right audience in a suitable style and format, and must meet reporting deadlines so the organisation can act on them.",
        },
      ],
      criteria: [
        { id: "a1-components", taskId: "activity-1", text: "Identifies the components of a report structure (title page, abstract, table of contents, introduction, main body, conclusion, recommendations, references, appendices).", marks: 6 },
        { id: "a1-purpose", taskId: "activity-1", text: "Explains the purpose of each section named.", marks: 5 },
        { id: "a1-contents", taskId: "activity-1", text: "Describes the contents of each section accurately (e.g. abstract under 200 words; appendices hold data not included in the body; main body in a logical sequence with informative headings).", marks: 4 },
        { id: "a2-examples", taskId: "activity-2", text: "Gives genuine business management report examples (e.g. internal investigation report, company/accident report, annual report, commission of enquiry, trade report).", marks: 3 },
        { id: "a2-purpose", taskId: "activity-2", text: "Notes what each example reports on or who it is written for.", marks: 2 },
        { id: "a3-variety", taskId: "activity-3", text: "Lists a variety of business and financial reports (e.g. financial statements, board reports, budgets, flash reports, proposals, strategic plans).", marks: 3 },
        { id: "a3-information", taskId: "activity-3", text: "Notes the business information each collected report provides.", marks: 2 },
        { id: "a4-needs", taskId: "activity-4", text: "Explains how business reports meet the information needs of the business and support decision-making.", marks: 3 },
        { id: "a4-record", taskId: "activity-4", text: "Mentions reports as a formal, verified record communicated in an appropriate style/format and delivered by the reporting deadline.", marks: 2 },
      ],
    },
  ],
};

for (const item of WORKBOOK_MEMO_8252.items) {
  for (const task of item.tasks ?? []) {
    if (detailedAnswers[task.id]) task.modelAnswer = detailedAnswers[task.id];
  }
}
