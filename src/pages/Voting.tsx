import { useEffect, useMemo, useState } from "react";
import { Icon } from "../icons";
import type { Profile } from "../types";
import { isStaff } from "../types";
import type { Poll, PollExtras } from "../store";
import { canVoteInPoll, loadProfiles, pollStatus, usePolls } from "../store";
import { fetchCloudDirectory, getCachedDirectory, remoteOnlyProfiles } from "../lib/directory";
import { ConfirmModal } from "../components/Modal";
import { DateTimePicker } from "../components/DateTimePicker";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Exact moment a vote was cast — date plus time to the second. */
const fmtStamp = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })} at ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** Local "YYYY-MM-DDTHH:mm" string — the datetime-local value format the pickers use. */
const localInputValue = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

/* ---------- staff: create a poll ---------- */

/** Half-written poll, kept per user so leaving the page doesn't lose it. */
type PollDraft = {
  open: boolean;
  question: string;
  description: string;
  options: string[];
  restrict: boolean;
  selected: string[];
  opensAt: string;
  closesAt: string;
};

const draftKey = (profileId: string) => `poll-draft:${profileId}`;

function loadDraft(profileId: string): PollDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(profileId));
    return raw ? (JSON.parse(raw) as PollDraft) : null;
  } catch {
    return null;
  }
}

function CreatePollForm({
  profile,
  people,
  onCreate,
}: {
  profile: Profile;
  people: Profile[];
  onCreate: (question: string, options: string[], extras: PollExtras) => void;
}) {
  const [draft] = useState(() => loadDraft(profile.id));
  const [open, setOpen] = useState(draft?.open ?? false);
  const [question, setQuestion] = useState(draft?.question ?? "");
  const [description, setDescription] = useState(draft?.description ?? "");
  const [options, setOptions] = useState<string[]>(
    draft?.options && draft.options.length >= 2 ? draft.options : ["", ""]
  );
  const [restrict, setRestrict] = useState(draft?.restrict ?? false);
  const [selected, setSelected] = useState<Set<string>>(new Set(draft?.selected ?? []));
  const [search, setSearch] = useState("");
  const [opensAt, setOpensAt] = useState(draft?.opensAt ?? "");
  const [closesAt, setClosesAt] = useState(draft?.closesAt ?? "");

  useEffect(() => {
    const untouched =
      !open &&
      !question &&
      !description &&
      options.every((o) => !o) &&
      !restrict &&
      !opensAt &&
      !closesAt;
    if (untouched) {
      localStorage.removeItem(draftKey(profile.id));
      return;
    }
    const d: PollDraft = {
      open,
      question,
      description,
      options,
      restrict,
      selected: [...selected],
      opensAt,
      closesAt,
    };
    localStorage.setItem(draftKey(profile.id), JSON.stringify(d));
  }, [open, question, description, options, restrict, selected, opensAt, closesAt, profile.id]);

  const filled = options.map((o) => o.trim()).filter(Boolean);

  const now = Date.now();
  const opensMs = opensAt ? new Date(opensAt).getTime() : null;
  const closesMs = closesAt ? new Date(closesAt).getTime() : null;
  let scheduleError = "";
  if (closesMs !== null) {
    if (closesMs <= now) scheduleError = "The closing time must be in the future.";
    else if (opensMs !== null && closesMs <= opensMs)
      scheduleError = "The closing time must be after the opening time.";
  }
  const scheduled = opensMs !== null && opensMs > now;

  const canSubmit =
    question.trim().length > 0 &&
    filled.length >= 2 &&
    !scheduleError &&
    (!restrict || selected.size >= 1);

  const visiblePeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q)
    );
  }, [people, search]);

  const togglePerson = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const reset = () => {
    setQuestion("");
    setDescription("");
    setOptions(["", ""]);
    setRestrict(false);
    setSelected(new Set());
    setSearch("");
    setOpensAt("");
    setClosesAt("");
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
      className="card vote-form"
      style={{ marginBottom: 16 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        const extras: PollExtras = {};
        if (description.trim()) extras.description = description;
        if (restrict && selected.size)
          extras.participants = people
            .filter((p) => selected.has(p.id))
            .map(({ id, name }) => ({ id, name }));
        // an opening time that's already past just means "open now"
        if (opensMs !== null && opensMs > Date.now())
          extras.opensAt = new Date(opensMs).toISOString();
        if (closesMs !== null) extras.closesAt = new Date(closesMs).toISOString();
        onCreate(question, filled, extras);
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

      <div className="field">
        <label>Who can vote</label>
        <div className="vote-restrict-row">
          <label className="vote-restrict-choice">
            <input
              type="radio"
              name="poll-audience"
              checked={!restrict}
              onChange={() => setRestrict(false)}
            />
            Everyone in the class
          </label>
          <label className="vote-restrict-choice">
            <input
              type="radio"
              name="poll-audience"
              checked={restrict}
              onChange={() => setRestrict(true)}
            />
            Only selected people
          </label>
        </div>
        {restrict && (
          <div className="vote-picker">
            <div className="vote-picker-tools">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people…"
                aria-label="Search people"
              />
              <button
                type="button"
                className="btn ghost sm"
                onClick={() =>
                  setSelected(
                    new Set(people.filter((p) => p.role === "Learner").map((p) => p.id))
                  )
                }
              >
                All learners
              </button>
              <button type="button" className="btn ghost sm" onClick={() => setSelected(new Set())}>
                Clear
              </button>
            </div>
            <div className="vote-picker-list" role="group" aria-label="Choose who may vote">
              {visiblePeople.length === 0 ? (
                <p className="vote-hint" style={{ margin: 8 }}>
                  {people.length === 0
                    ? "No accounts found yet — people appear here once their accounts have been added or have signed in."
                    : "No people match your search."}
                </p>
              ) : (
                visiblePeople.map((p) => (
                  <label key={p.id} className="vote-picker-person">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => togglePerson(p.id)}
                    />
                    <span className="vote-picker-name">
                      {p.name}
                      {p.id === profile.id ? " (you)" : ""}
                    </span>
                    <span className="vote-picker-role">{p.role}</span>
                  </label>
                ))
              )}
            </div>
            <p className="vote-hint" style={{ marginTop: 6 }}>
              {selected.size === 0
                ? "Pick at least one person — only the people you tick will be able to vote."
                : `${selected.size} ${selected.size === 1 ? "person" : "people"} selected.`}
            </p>
          </div>
        )}
      </div>

      <div className="field">
        <label>Schedule (optional)</label>
        <div className="vote-schedule">
          <div>
            <label htmlFor="poll-opens" className="vote-schedule-label">
              Opens
            </label>
            <DateTimePicker
              id="poll-opens"
              value={opensAt}
              min={localInputValue(new Date())}
              onChange={setOpensAt}
              placeholder="Straight away"
            />
          </div>
          <div>
            <label htmlFor="poll-closes" className="vote-schedule-label">
              Closes
            </label>
            <DateTimePicker
              id="poll-closes"
              value={closesAt}
              min={opensAt || localInputValue(new Date())}
              onChange={setClosesAt}
              placeholder="When you close it"
            />
          </div>
        </div>
        {scheduleError ? (
          <p className="vote-hint danger-text" style={{ marginTop: 6 }}>
            {scheduleError}
          </p>
        ) : (
          <p className="vote-hint" style={{ marginTop: 6 }}>
            Leave blank to open immediately and close manually. A scheduled poll unlocks itself at
            the opening time and stops taking votes at the closing time.
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button className="btn primary" type="submit" disabled={!canSubmit}>
          {scheduled ? "Schedule poll" : "Open poll"}
        </button>
        <button className="btn ghost" type="button" onClick={reset}>
          Cancel
        </button>
      </div>
      <p className="page-sub" style={{ margin: "10px 0 0" }}>
        Posting as {profile.name} · {profile.role}. Every eligible voter gets one vote and can
        change it until the poll closes.
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
  const status = pollStatus(poll);
  const restricted = !!poll.participants?.length;
  const isParticipant = !restricted || poll.participants!.some((m) => m.id === profile.id);
  const iCanVote = canVoteInPoll(poll, profile.id);
  const votes = Object.values(poll.votes);
  const total = votes.length;
  const myVote = poll.votes[profile.id]?.option;
  const counts = new Map<string, number>();
  for (const v of votes) counts.set(v.option, (counts.get(v.option) ?? 0) + 1);
  const leading = Math.max(0, ...counts.values());
  const canManage = staff || poll.byId === profile.id;

  const optionTitle = (mine: boolean): string => {
    if (status === "closed") return "This poll is closed";
    if (status === "scheduled")
      return `Voting opens ${poll.opensAt ? fmtDateTime(poll.opensAt) : "later"}`;
    if (!isParticipant) return "Only the selected participants can vote in this poll";
    return mine ? "Click to withdraw your vote" : "Click to vote for this option";
  };

  return (
    <div className="card vote-card">
      <div className="vote-tiles">
        <div className={`vote-tile status ${status}`}>
          <span className="vote-tile-value">
            {status === "open" ? "Open" : status === "scheduled" ? "Scheduled" : "Closed"}
          </span>
          <span className="vote-tile-label">
            {status === "open" && poll.closesAt
              ? `Closes ${fmtDateTime(poll.closesAt)}`
              : status === "scheduled" && poll.opensAt
                ? `Opens ${fmtDateTime(poll.opensAt)}`
                : status === "closed" && !poll.closed && poll.closesAt
                  ? `Closed ${fmtDateTime(poll.closesAt)}`
                  : "Status"}
          </span>
        </div>
        <div className="vote-tile">
          <span className="vote-tile-value">{total}</span>
          <span className="vote-tile-label">{total === 1 ? "vote cast" : "votes cast"}</span>
        </div>
        {restricted && (
          <div className="vote-tile" title="Only selected people can vote in this poll">
            <span className="vote-tile-value">{poll.participants!.length}</span>
            <span className="vote-tile-label">invited to vote</span>
          </div>
        )}
      </div>

      <div className="vote-head">
        <div>
          <h2 className="vote-question">{poll.question}</h2>
          {poll.description && <p className="vote-desc">{poll.description}</p>}
          <div className="vote-meta">
            Started by {poll.by} · {poll.role} · {fmtDate(poll.at)}
          </div>
        </div>
      </div>

      <div className="vote-options" role="group" aria-label={`Options for: ${poll.question}`}>
        {poll.options.map((opt, displayPos) => {
          const n = counts.get(opt.id) ?? 0;
          const pct = total ? Math.round((n / total) * 100) : 0;
          const mine = myVote === opt.id;
          return (
            <button
              key={opt.id}
              className={`opt vote-opt${mine ? " selected" : ""}`}
              disabled={!iCanVote}
              onClick={() => (mine ? onRetract() : onVote(opt.id))}
              aria-pressed={mine}
              title={optionTitle(mine)}
            >
              <span className="mark">
                <Icon name={mine ? "checkCircle" : "circle"} size={17} />
              </span>
              <span className="opt-letter">{String.fromCharCode(65 + displayPos)}</span>
              <span className="vote-opt-main">
                <span className="vote-opt-label">
                  {opt.label}
                  {mine && <span className="badge">Your vote</span>}
                </span>
                <span className={`bar${total && n === leading ? " green" : ""}`}>
                  <span style={{ width: `${pct}%` }} />
                </span>
              </span>
              <span className="vote-option-count">
                {n} · {pct}%
              </span>
            </button>
          );
        })}
      </div>

      {status === "scheduled" && (
        <p className="vote-hint">
          Voting hasn&rsquo;t opened yet
          {poll.opensAt ? ` — it opens ${fmtDateTime(poll.opensAt)}.` : "."}
        </p>
      )}
      {status === "open" && !isParticipant && (
        <p className="vote-hint">
          Only the {poll.participants!.length} selected participant
          {poll.participants!.length === 1 ? "" : "s"} can vote in this poll — you can follow the
          results here.
        </p>
      )}
      {iCanVote && !myVote && (
        <p className="vote-hint">Tap an option to cast your vote — you can change it any time.</p>
      )}

      {canManage && restricted && (
        <p className="vote-participants">
          <strong>Invited voters:</strong> {poll.participants!.map((m) => m.name).join(", ")}
        </p>
      )}

      {canManage && (
        <div className="vote-admin">
          {status === "open" ? (
            <button className="btn ghost sm" onClick={() => onSetClosed(true)}>
              Close poll
            </button>
          ) : status === "scheduled" ? (
            <button className="btn ghost sm" onClick={() => onSetClosed(false)}>
              Open now
            </button>
          ) : (
            <button className="btn ghost sm" onClick={() => onSetClosed(false)}>
              Reopen poll
            </button>
          )}
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
        <ol className="vote-voters">
          {Object.entries(poll.votes)
            .sort(([, a], [, b]) => a.at.localeCompare(b.at))
            .map(([pid, v]) => {
              const label = poll.options.find((o) => o.id === v.option)?.label ?? "—";
              return (
                <li key={pid}>
                  <strong>{v.by}</strong> voted “{label}” · {fmtStamp(v.at)}
                </li>
              );
            })}
        </ol>
      )}
    </div>
  );
}

/* ---------- page ---------- */

export function VotingPage({ profile }: { profile: Profile }) {
  const { polls, create, vote, retract, setClosed, remove } = usePolls();
  const staff = isStaff(profile.role);
  const [confirmDelete, setConfirmDelete] = useState<Poll | null>(null);

  // re-render every 30s so scheduled polls unlock and timed polls close on their own
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => window.clearInterval(t);
  }, []);

  // roster for the participant picker — same merge as the People page:
  // this device's accounts + cloud accounts, with duplicate copies of the
  // same person (matched by id / ID number / email / name) collapsed
  const [cloudProfiles, setCloudProfiles] = useState<Profile[]>(
    () => getCachedDirectory()?.profiles ?? []
  );
  useEffect(() => {
    if (!staff) return;
    let alive = true;
    void fetchCloudDirectory().then((d) => {
      if (alive && d) setCloudProfiles(d.profiles);
    });
    return () => {
      alive = false;
    };
  }, [staff]);
  const people = useMemo(() => {
    const local = loadProfiles();
    const remote = remoteOnlyProfiles(local, cloudProfiles);
    return [...local, ...remote].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [cloudProfiles]);

  return (
    <>
      <div className="eyebrow">
        <Icon name="chart" size={15} />
        Voting Station
      </div>
      <h1 className="page-title">Voting Station</h1>
      <p className="page-sub">
        Vote for an action or person put forward to the class. Each eligible voter gets one vote
        per poll and can change it until the poll closes. Results are shared with the whole class.
      </p>

      {staff && (
        <CreatePollForm
          profile={profile}
          people={people}
          onCreate={(q, opts, extras) => create(profile, q, opts, extras)}
        />
      )}

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
