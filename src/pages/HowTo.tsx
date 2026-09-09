import { Icon } from "../icons";
import type { Route } from "../types";
import { COURSE_META, MODULES, TOTAL_UNITS } from "../data/course";

interface Step {
  icon: string;
  title: string;
  text: string;
  go?: { label: string; route: Route };
}

const STEPS: Step[] = [
  {
    icon: "person",
    title: "Complete your profile and enrolment",
    text: "Fill in and sign your enrolment information, set a password, and upload a photo of your handwritten signature. Your name, ID and employer details flow into every register and report, so get them right first.",
    go: { label: "Go to Profile", route: { page: "profile" } },
  },
  {
    icon: "clipboard",
    title: "Sign the attendance register every session day",
    text: "On each training day, open the Attendance Register and sign next to your name. Signing every session from your first day keeps your attendance rate at 100%.",
    go: { label: "Go to Attendance Register", route: { page: "attendance" } },
  },
  {
    icon: "book",
    title: "Work through every lesson, slide by slide",
    text: `Open My Course and start the first unit standard. Read every lesson screen to the end — finishing a lesson credits the "Lesson & Training Aids" stage for that unit. There are ${TOTAL_UNITS} unit standards across ${MODULES.length} modules.`,
    go: { label: "Go to My Course", route: { page: "course" } },
  },
  {
    icon: "exercise",
    title: "Do the activities and exercises",
    text: 'Answer the written activities in your own words — one key idea per box. They are auto-marked and you get up to 3 attempts; your best score is saved. Any attempted exercise or quiz credits the "Formative Assessment" stage.',
  },
  {
    icon: "checkCircle",
    title: "Pass every knowledge quiz with 80% or more",
    text: 'Each unit ends with knowledge quizzes. 80%+ is competent — your best score is saved to your profile, and you can retake a quiz to improve. This is your "Summative Assessment" stage.',
  },
  {
    icon: "folder",
    title: "Upload your Portfolio of Evidence (POE)",
    text: 'Upload every required POE item for each unit — assignments, screenshots, signed documents. An uploaded item credits the "POE Evidence" stage, and your assessor reviews each one.',
    go: { label: "Go to Portfolio of Evidence", route: { page: "poe" } },
  },
  {
    icon: "checklist",
    title: "Hand in your Appendix C documents",
    text: "Certified copy of your ID, certified Matric/Senior Certificate, your CV and the signed learnership agreement. Tick each one off on the Appendix C Checklist as you hand it in.",
    go: { label: "Go to Appendix C Checklist", route: { page: "checklist" } },
  },
  {
    icon: "document",
    title: "Sign the Section D declaration and keep your logbook",
    text: "Complete the Section D declaration and fill in your logbook entries as you work through each unit — your facilitator signs them off.",
    go: { label: "Go to Section D", route: { page: "sectiond" } },
  },
  {
    icon: "award",
    title: "Get assessed Competent on every unit",
    text: `Your assessor reviews your work and records the formal outcome per unit standard. Credits only count once a unit is marked Competent — all units together earn the full ${COURSE_META.credits} credits.`,
    go: { label: "See your outcomes on Compliance", route: { page: "compliance" } },
  },
  {
    icon: "trend",
    title: "Watch your Dashboard hit 100%",
    text: "Your completion ring reaches 100% when all four stages — Lesson & Training Aids, Formative Assessment, Summative Assessment and POE Evidence — are done for every unit standard. Check Progress to see exactly what is still open per unit.",
    go: { label: "Go to Progress", route: { page: "progress" } },
  },
];

export function HowToPage({ navigate }: { navigate: (r: Route) => void }) {
  return (
    <>
      <h2 className="section-title">
        <span className="ico">
          <Icon name="target" size={20} />
        </span>
        How to reach 100% complete
      </h2>
      <p className="muted howto-intro">
        Every unit standard tracks four stages: Lesson &amp; Training Aids, Formative Assessment,
        Summative Assessment and POE Evidence. Do the steps below, in order, for every unit — and
        your programme completion reaches 100%.
      </p>

      <ol className="howto-steps">
        {STEPS.map((s, i) => (
          <li className="howto-step" key={s.title}>
            <span className="howto-num">{i + 1}</span>
            <div className="howto-body">
              <div className="howto-title">
                <span className="howto-ico">
                  <Icon name={s.icon} size={18} />
                </span>
                {s.title}
              </div>
              <p className="howto-text">{s.text}</p>
              {s.go && (
                <button type="button" className="btn ghost sm howto-go" onClick={() => navigate(s.go!.route)}>
                  {s.go.label} <Icon name="chevronRight" size={14} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="callout howto-callout">
        <span className="ico">
          <Icon name="info" size={18} />
        </span>
        <div>
          Stuck on anything? Ask on the <strong>Community &amp; Support</strong> page or message
          your facilitator on <strong>Chat</strong> — and keep an eye on the Training Calendar for
          session dates and deadlines.
        </div>
      </div>
    </>
  );
}
