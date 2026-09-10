import { useState } from "react";
import { Icon } from "../icons";
import type { Profile } from "../types";
import { isStaff } from "../types";
import type { Poll } from "../store";
import { usePolls } from "../store";
import { ConfirmModal } from "../components/Modal";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

/* ---------- staff: create a poll ---------- */

function CreatePollForm({ profile, onCreate }: { profile: Profile; onCreate: (question: string, options: string[], description?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);

  const filled = options.map((o) => o.trim()).filter(Boolean);
  const canSubmit = question.trim().length > 0 && filled.length >= 2;

  const reset = () => {
    setQuestion("");
    setDescription("");
    setOptions(["", ""]);
    setOpen(false);
  };

  if (!open) {
    return (
      <button className="btn" style={{ marginBottom: 16 }} onClick={() => setOpen(true)}>
        <Icon name="chart" size={16} /> New poll
      </button>
    );
  }

  return (
    <form
      className="card"
      style={{ marginBottom: 16 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onCreate(question, filled, description);
        reset();
      }}
    >
      <h2 className="section-title mt-0" style={{ margin: "0 0 12px" }}>
        <span className="ico">
          <Icon name="chart" size={20} />
        </span>
        New poll
      </h2>
      <div className="field">
        <label htmlFor="poll-question">Question</label>
        <input
          id="poll-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Who should be class representative?"
          maxLength={200}
          autoFocus
        />
      </div>
      <div className="field">
        <label htmlFor="poll-desc">Details (optional)</label>
        <textarea
          id="poll-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Any context learners should know before voting"
          rows={2}
          maxLength={500}
        />
      </div>
      <div className="field">
        <label>Options (at least 2)</label>
        {options.map((opt, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={opt}
              onChange={(e) => setOptions(options.map((o, j) => (j === i ? e.target.value : o)))}
              placeholder={`Option ${i + 1}`}
              maxLength={120}
              aria-label={`Option ${i + 1}`}
              style={{ flex: 1 }}
            />
            {options.length > 2 && (
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => setOptions(options.filter((_, j) => j !== i))}
                aria-label={`Remove option ${i + 1}`}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="btn ghost sm"
          onClick={() => setOptions([...options, ""])}
          disabled={options.length >= 12}
        >
          + Add option
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button className="btn primary" type="submit" disabled={!canSubmit}>
          Open poll
        </button>
        <button className="btn ghost" type="button" onClick={reset}>
          Cancel
        </button>
      </div>
      <p className="page-sub" style={{ margin: "10px 0 0", fontSize: 13 }}>
        Posting as {profile.name} · {profile.role}. Every learner gets one vote and can change it
        until the poll is closed.
      </p>
    </form>
  );
}

/* ---------- one poll card ---------- */

function PollCard({
  poll,
  profile,
  staff,
  onVote,
  onRetract,
  onSetClosed,
  onDelete,
}: {
  poll: Poll;
  profile: Profile;
  staff: boolean;
  onVote: (optionId: string) => void;
  onRetract: () => void;
  onSetClosed: (closed: boolean) => void;
  onDelete: () => void;
}) {
  const [showVoters, setShowVoters] = useState(false);
  const votes = Object.values(poll.votes);
  const total = votes.length;
  const myVote = poll.votes[profile.id]?.option;
  const counts = new Map<string, number>();
  for (const v of votes) counts.set(v.option, (counts.get(v.option) ?? 0) + 1);
  const leading = Math.max(0, ...counts.values());
  const canManage = staff || poll.byId === profile.id;

  return (
    <div className="card vote-card">
      <div className="vote-head">
        <div>
          <h2 className="vote-question">{poll.question}</h2>
          {poll.description && <p className="vote-desc">{poll.description}</p>}
          <div className="vote-meta">
            Started by {poll.by} · {poll.role} · {fmtDate(poll.at)}
          </div>
        </div>
        <div className="vote-chips">
          <span className={`chip ${poll.closed ? "none" : "done"}`}>
            {poll.closed ? "Closed" : "Open"}
          </span>
          <span className="chip progress">
            {total} vote{total === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="vote-options" role="group" aria-label={`Options for: ${poll.question}`}>
        {poll.options.map((opt) => {
          const n = counts.get(opt.id) ?? 0;
          const pct = total ? Math.round((n / total) * 100) : 0;
          const mine = myVote === opt.id;
          return (
            <button
              key={opt.id}
              className={`vote-option${mine ? " mine" : ""}`}
              disabled={!!poll.closed}
              onClick={() => (mine ? onRetract() : onVote(opt.id))}
              aria-pressed={mine}
              title={
                poll.closed
                  ? "This poll is closed"
                  : mine
                    ? "Click to withdraw your vote"
                    : "Click to vote for this option"
              }
            >
              <span className="vote-option-row">
                <span className="vote-option-label">
                  {mine && (
                    <span className="ico">
                      <Icon name="checkCircle" size={16} />
                    </span>
                  )}
                  {opt.label}
                  {mine && <span className="badge">Your vote</span>}
                </span>
                <span className="vote-option-count">
                  {n} · {pct}%
                </span>
              </span>
              <span className={`bar${total && n === leading ? " green" : ""}`}>
                <span style={{ width: `${pct}%` }} />
              </span>
            </button>
          );
        })}
      </div>

      {!poll.closed && !myVote && (
        <p className="vote-hint">Tap an option to cast your vote — you can change it any time.</p>
      )}

      {canManage && (
        <div className="vote-admin">
          <button className="btn ghost sm" onClick={() => onSetClosed(!poll.closed)}>
            {poll.closed ? "Reopen poll" : "Close poll"}
          </button>
          {staff && total > 0 && (
            <button className="btn ghost sm" onClick={() => setShowVoters((s) => !s)}>
              {showVoters ? "Hide voters" : "Show voters"}
            </button>
          )}
          <button className="btn ghost sm danger-text" onClick={onDelete}>
            Delete
          </button>
        </div>
      )}

      {staff && showVoters && total > 0 && (
        <ul className="vote-voters">
          {Object.entries(poll.votes)
            .sort(([, a], [, b]) => a.at.localeCompare(b.at))
            .map(([pid, v]) => {
              const label = poll.options.find((o) => o.id === v.option)?.label ?? "—";
              return (
                <li key={pid}>
                  <strong>{v.by}</strong> voted “{label}” · {fmtDate(v.at)}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}

/* ---------- page ---------- */

export function VotingPage({ profile }: { profile: Profile }) {
  const { polls, create, vote, retract, setClosed, remove } = usePolls();
  const staff = isStaff(profile.role);
  const [confirmDelete, setConfirmDelete] = useState<Poll | null>(null);

  return (
    <>
      <div className="eyebrow">
        <Icon name="chart" size={15} />
        Class Voting
      </div>
      <h1 className="page-title">Class voting</h1>
      <p className="page-sub">
        Vote for an action or person put forward to the class. Each person gets one vote per poll
        and can change it until the poll is closed. Results are shared with the whole class.
      </p>

      {staff && <CreatePollForm profile={profile} onCreate={(q, opts, d) => create(profile, q, opts, d)} />}

      {polls.length === 0 ? (
        <div className="callout">
          <span className="ico">
            <Icon name="info" size={19} />
          </span>
          <span>
            No polls yet.
            {staff
              ? " Use “New poll” above to put an action or person to the class."
              : " Your facilitator will open a poll here when the class needs to decide on something."}
          </span>
        </div>
      ) : (
        polls.map((p) => (
          <PollCard
            key={p.id}
            poll={p}
            profile={profile}
            staff={staff}
            onVote={(optionId) => vote(profile, p.id, optionId)}
            onRetract={() => retract(profile.id, p.id)}
            onSetClosed={(closed) => setClosed(p.id, closed)}
            onDelete={() => setConfirmDelete(p)}
          />
        ))
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete poll"
          message={
            <>
              Delete the poll <strong>“{confirmDelete.question}”</strong> and all its votes? This
              cannot be undone.
            </>
          }
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            remove(confirmDelete.id);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
