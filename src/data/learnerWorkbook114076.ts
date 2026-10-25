import type { PracticalTaskDocument } from "../types";

/** Learner workbook for US 114076, presented through the same editable document
 * renderer used by the 114046 workbook. The supplied PDF remains available as
 * the source download while these controls preserve learner answers in-app. */
export const LEARNER_WORKBOOK_114076: PracticalTaskDocument = {
  title: "Use computer technology to research a computer topic",
  subtitle: "Unit Standard 114076 · NQF Level 4 · 3 credits",
  sourceName: "US-114076-Learner-Workbook.pdf",
  notice: "Complete the learner details, research activities and assessment responses. Answers save automatically when you leave a field.",
  sections: [
    { id: "learner-information", title: "Learner information", fields: [
      { id: "name", label: "Name" }, { id: "surname", label: "Surname" },
      { id: "id-number", label: "ID number" }, { id: "contact", label: "Contact number", type: "tel" },
    ] },
    { id: "workshop-details", title: "Workshop details", fields: [
      { id: "organisation", label: "Organisation" }, { id: "facilitator", label: "Facilitator name" },
      { id: "date-started", label: "Date started", type: "date" }, { id: "date-completed", label: "Date completed", type: "date" },
    ] },
    { id: "research-topic", title: "Research topic", description: "Select a computer-related topic, plan your research and record reliable sources.", fields: [
      { id: "topic", label: "Research topic" }, { id: "research-question", label: "Research question", type: "textarea" },
      { id: "purpose", label: "Purpose and scope of the research", type: "textarea" },
    ], items: [
      { id: "sources", text: "Identify and record appropriate sources of information for the selected computer topic.", guidance: "Use relevant books, websites, manuals or other reliable sources and record enough detail to locate each source again.", responseLabel: "Learner response and evidence" },
      { id: "search-strategy", text: "Describe the search strategy and computer technology used to find and evaluate information.", guidance: "Explain keywords, search tools, selection criteria and how you checked accuracy, relevance and currency.", responseLabel: "Answer" },
      { id: "findings", text: "Present the research findings in a clear, structured format.", guidance: "Summarise the important information, use headings and acknowledge the sources consulted.", responseLabel: "Research findings" },
      { id: "conclusion", text: "Draw a conclusion from the research and explain how the information can be applied.", responseLabel: "Answer" },
    ] },
    { id: "reflection", title: "Reflection and evidence", fields: [
      { id: "reflection", label: "Reflection on the research process", type: "textarea" },
      { id: "evidence", label: "Supporting evidence or annexures", type: "textarea" },
    ] },
    { id: "assessment", title: "Assessment judgement", fields: [
      { id: "assessor-comments", label: "Assessor comments", type: "textarea" },
      { id: "outcome", label: "Assessment outcome", type: "select", options: ["", "Competent", "Not yet competent"] },
      { id: "assessor-name", label: "Assessor name" }, { id: "assessor-date", label: "Assessment date", type: "date" },
      { id: "learner-signature", label: "Learner signature" }, { id: "learner-date", label: "Learner date", type: "date" },
    ] },
  ],
};
