/** The standard navigation is independent of how much content a unit has. */
export const STANDARD_UNIT_TABS = [
  { id: "overview", label: "Learning activities", icon: "checklist" },
  { id: "saqa", label: "SAQA details", icon: "certificate" },
  { id: "lesson", label: "Lesson", icon: "book" },
  { id: "material", label: "Course material", icon: "play" },
  { id: "notes", label: "Notes", icon: "document" },
  { id: "exercises", label: "Activity", icon: "exercise" },
  { id: "workbook", label: "Learner Workbook", icon: "document" },
  { id: "memo", label: "Memo", icon: "clipboard" },
  { id: "guide", label: "Learner Guide", icon: "book" },
  { id: "logbook", label: "Logbook", icon: "book" },
  { id: "quiz", label: "Quiz", icon: "clipboard" },
  { id: "selfassessment", label: "Self assessment", icon: "checkCircle" },
  { id: "evaluation", label: "Evaluation", icon: "chat" },
  { id: "plan", label: "Lesson plan", icon: "presenter" },
] as const;
