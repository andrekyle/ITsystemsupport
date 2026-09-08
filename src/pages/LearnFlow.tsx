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
        Run your entire learnership
        <br />
        with <span className="lf-brand">LearnFlow</span>.
      </h1>
      <div className="lf-flow">
        {STEPS.map((s, i) => (
          <span key={s} className="lf-seg">
            <span className={`lf-step${i === STEPS.length - 1 ? " last" : ""}`}>{s}</span>
            {i < STEPS.length - 1 && (
              <span className="lf-arrow" aria-hidden="true">
                →
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
