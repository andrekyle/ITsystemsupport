import { Icon } from "../icons";

const STEPS = [
  "Enrolment",
  "Attendance",
  "Learning",
  "Activities",
  "Assessments",
  "POE",
  "Logbook",
  "Assessor",
  "Moderation",
  "Reporting",
  "Completion",
];

function Chain() {
  return (
    <span className="lf-chain">
      {STEPS.map((s, i) => {
        const last = i === STEPS.length - 1;
        return (
          <span key={s} className="lf-seg">
            <span className={`lf-step${last ? " last" : ""}`}>
              <span className="lf-num">
                {last ? <Icon name="check" size={15} /> : String(i + 1).padStart(2, "0")}
              </span>
              {s}
            </span>
            <svg className="lf-arrow" viewBox="0 0 44 24" aria-hidden="true">
              <path d="M2 12h38M33.5 5.5 40 12l-6.5 6.5" />
            </svg>
          </span>
        );
      })}
    </span>
  );
}

export function LearnFlowPage() {
  return (
    <div className="learnflow-page">
      <h1 className="lf-title">
        Run your entire learnership
        <br />
        with <span className="lf-brand">LearnFlow</span>.
      </h1>
      {/* the journey glides past as one continuous loop — the chain is drawn
          twice so the animation can wrap seamlessly */}
      <div className="lf-flow" aria-label={`The LearnFlow journey: ${STEPS.join(", ")}`}>
        <div className="lf-track">
          <Chain />
          <span aria-hidden="true" className="lf-dup">
            <Chain />
          </span>
        </div>
      </div>
    </div>
  );
}
