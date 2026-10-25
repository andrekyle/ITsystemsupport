import type { WorkbookMemoState } from "../store";

/** Baseline memo generated from the 114076 learner-workbook/research topics. */
export const WORKBOOK_MEMO_114076: WorkbookMemoState = {
  model: "Generated from the 114076 learner workbook and learner-guide research outcomes",
  updatedAt: "2026-10-25T00:00:00.000Z",
  items: [
    { id: "research-topic", question: "Research topic and scope", maxMarks: 10, tasks: [{ id: "topic", task: 1, text: "Define a focused computer-related research topic, question and scope.", marks: 10, modelAnswer: "The learner identifies a specific computer topic, states a focused research question and explains the scope and purpose of the investigation." }], criteria: [
      { id: "topic-focus", taskId: "topic", text: "Topic is specific and computer-related.", marks: 3 },
      { id: "research-question", taskId: "topic", text: "Research question is clear and answerable.", marks: 3 },
      { id: "scope", taskId: "topic", text: "Purpose and scope are explained realistically.", marks: 4 },
    ] },
    { id: "sources", question: "Sources and search strategy", maxMarks: 15, tasks: [{ id: "sources", task: 2, text: "Identify reliable sources and explain the search and evaluation strategy.", marks: 15, modelAnswer: "The learner records appropriate sources, search terms/tools and checks for authority, relevance, accuracy and currency." }], criteria: [
      { id: "source-selection", taskId: "sources", text: "Uses relevant and sufficiently varied sources.", marks: 5 },
      { id: "search-method", taskId: "sources", text: "Explains keywords, search tools and selection method.", marks: 5 },
      { id: "evaluation", taskId: "sources", text: "Explains how source reliability, relevance and currency were checked.", marks: 5 },
    ] },
    { id: "findings", question: "Research findings", maxMarks: 15, tasks: [{ id: "findings", task: 3, text: "Present and communicate the research findings.", marks: 15, modelAnswer: "The learner presents accurate, structured findings using headings, a logical sequence, appropriate terminology and acknowledged sources." }], criteria: [
      { id: "accuracy", taskId: "findings", text: "Information is accurate and relevant to the research question.", marks: 5 },
      { id: "structure", taskId: "findings", text: "Findings are logically structured and clearly communicated.", marks: 5 },
      { id: "acknowledgement", taskId: "findings", text: "Sources are acknowledged and evidence is used appropriately.", marks: 5 },
    ] },
    { id: "conclusion", question: "Conclusion and reflection", maxMarks: 10, tasks: [{ id: "conclusion", task: 4, text: "Draw a conclusion, explain application and reflect on the research process.", marks: 10, modelAnswer: "The learner answers the research question, identifies an appropriate application and reflects on strengths, limitations or improvements." }], criteria: [
      { id: "conclusion-answer", taskId: "conclusion", text: "Conclusion follows from the findings and answers the question.", marks: 4 },
      { id: "application", taskId: "conclusion", text: "Explains a practical application of the research.", marks: 3 },
      { id: "reflection", taskId: "conclusion", text: "Reflection identifies learning, limitations or improvements.", marks: 3 },
    ] },
  ],
};
