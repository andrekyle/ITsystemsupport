import type { PracticalTaskDocument } from "../types";

export const PRACTICAL_TASK_114046: PracticalTaskDocument = {
  title: "Practical Task",
  subtitle: "Demonstrate an understanding of issues affecting the management of a local area computer network (LAN)",
  sourceName: "SAQA-114046 - Practical task.pdf",
  notice: "Complete the learner and workplace details, answer each practical activity, and provide the required workplace evidence. Your answers save automatically when you leave a field.",
  sections: [
    {
      id: "learner-information",
      title: "Learner information",
      fields: [
        { id: "name", label: "Name" },
        { id: "surname", label: "Surname" },
        { id: "id-number", label: "ID number" },
        { id: "contact", label: "Contact number", type: "tel" },
      ],
    },
    {
      id: "learner-details",
      title: "General information · Learner details",
      fields: [
        { id: "full-names", label: "Learner full names" },
        { id: "learner-number", label: "Learner number" },
        { id: "organisation", label: "Organisation" },
        { id: "unit-department", label: "Unit / department" },
        { id: "telephone", label: "Telephone / cell number", type: "tel" },
        { id: "email", label: "Email address", type: "email" },
      ],
    },
    {
      id: "workshop-details",
      title: "Workshop details",
      fields: [
        { id: "venue", label: "Workshop venue" },
        { id: "facilitator", label: "Facilitator name" },
        { id: "date-started", label: "Date started", type: "date" },
        { id: "date-completed", label: "Date completed", type: "date" },
      ],
    },
    {
      id: "workplace-details",
      title: "Practical workplace details",
      description: "The workplace tasks are building blocks for the practical assessment. Complete every task and submit supporting evidence.",
      fields: [
        { id: "workplace-name", label: "Workplace name" },
        { id: "workplace-address", label: "Workplace address", type: "textarea" },
        { id: "mentor-name", label: "Coach / mentor full names" },
        { id: "mentor-contact", label: "Coach / mentor contact details" },
        { id: "mentor-position", label: "Coach / mentor position" },
        { id: "submission-date", label: "Submission due date", type: "date" },
        { id: "late-reason", label: "Reason for late submission (if applicable)", type: "textarea" },
        { id: "received-by", label: "Received by" },
        { id: "received-on", label: "Received on", type: "date" },
      ],
    },
    {
      id: "so1",
      title: "SO 1 · Manage access to a local area network",
      description: "Explain the management of access to a LAN. Your response must distinguish between the access and responsibilities of a user, operator, and administrator.",
      items: [
        { id: "access-categories", text: "Explain access for the different categories of people: User, Operator and Administrator.", guidance: "Describe permissions, responsibilities, authentication and the principle of least privilege.", responseLabel: "Learner practical response and evidence" },
        { id: "integrated-theory", text: "Integrated theory question", guidance: "Explain how access controls protect LAN resources while still allowing people to perform their assigned work.", responseLabel: "Answer" },
      ],
    },
    {
      id: "so2",
      title: "SO 2 · Typical viruses on local area networks",
      description: "Explain typical malware affecting a LAN and the controls used to prevent, detect and respond to it.",
      items: [
        { id: "virus-types", text: "Explain at least two relevant threat types, including Trojan horses, spoofing and worms.", guidance: "For each threat, describe how it spreads or works, its likely impact on the LAN, warning signs and suitable controls.", responseLabel: "Learner practical response and evidence" },
        { id: "controls", text: "Describe the practical controls you would apply to protect the LAN.", guidance: "Consider endpoint protection, patching, access control, email/web filtering, backups, monitoring and user awareness.", responseLabel: "Answer" },
        { id: "integrated-theory", text: "Integrated theory question", guidance: "Explain how your selected controls work together as layered security.", responseLabel: "Answer" },
      ],
    },
    {
      id: "witness-testimony",
      title: "Witness testimony",
      description: "This section must be completed from the supervisor or manager’s observation of the learner’s workplace performance. Separate supporting evidence may be referenced below.",
      fields: [
        { id: "unit-title", label: "Unit standard title" },
        { id: "saqa-id", label: "SAQA ID", placeholder: "114046" },
        { id: "testimonial", label: "Supervisor / manager testimonial", type: "textarea" },
        { id: "evidence", label: "Comments and evidence of workplace performance", type: "textarea" },
        { id: "supervisor-name", label: "Supervisor / manager name" },
        { id: "supervisor-date", label: "Supervisor acknowledgement date", type: "date" },
        { id: "assessor-name", label: "Assessor name" },
        { id: "assessor-date", label: "Assessor acknowledgement date", type: "date" },
        { id: "learner-comments", label: "Learner comments and feedback", type: "textarea" },
        { id: "learner-date", label: "Learner acknowledgement date", type: "date" },
        { id: "moderator-comments", label: "Moderator comments and feedback", type: "textarea" },
        { id: "moderator-date", label: "Moderator acknowledgement date", type: "date" },
      ],
    },
    {
      id: "overall-performance",
      title: "Overall performance of the learner",
      fields: [
        { id: "sop-outcome", label: "Standard operating procedure outcome", type: "select", options: ["", "Meets SOP", "Does not meet SOP"] },
        { id: "assessment-outcome", label: "Integrated assessment outcome", type: "select", options: ["", "Competent", "Not yet competent"] },
        { id: "assessor-signature", label: "Assessor name / signature confirmation" },
        { id: "learner-signature", label: "Learner name / signature confirmation" },
        { id: "assessor-final-date", label: "Assessor date", type: "date" },
        { id: "learner-final-date", label: "Learner date", type: "date" },
      ],
    },
  ],
};

export function practicalTaskForUnit(us: string): PracticalTaskDocument | undefined {
  return us === "114046" ? PRACTICAL_TASK_114046 : undefined;
}
