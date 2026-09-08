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

export function LearnFlowPage() {
  return (
    <div className="learnflow-page">
      <h1 className="lf-title">
        Run your entire learnership with <span className="lf-brand">LearnFlow</span>.
      </h1>
      <p className="lf-flow">
        {STEPS.map((s, i) => (
          <span key={s} className="lf-step">
            {s}
            {i < STEPS.length - 1 && (
              <span className="lf-arrow" aria-hidden="true">
                {" \u2192 "}
              </span>
            )}
          </span>
        ))}
      </p>
    </div>
  );
}
