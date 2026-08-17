import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../icons";
import type { Profile, Route } from "../types";
import { isStaff } from "../types";
import {
  deleteChatThread,
  useChat,
  useChatThreads,
  type ChatMessage,
  type ChatThreadInfo,
} from "../store";
import { fetchCloudDirectory, fetchSuperUserAuthId } from "../lib/directory";
import type { CloudDirectory } from "../lib/directory";
import { Avatar } from "../components/Avatar";
import { ConfirmModal } from "../components/Modal";
import { logAudit } from "../lib/audit";

/**
 * Direct messages: 1-to-1 chat between any two people on the course.
 *
 * All identities are cloud identities: the sidebar lists every account that
 * has signed in to Supabase (via `cloud.profiles`) and the sender of every
 * message is resolved through their `sender_user_id` (auth uid) — the
 * canonical identity. No local seeded profile is ever considered here, so
 * a learner appearing on this page is guaranteed to be the *real* user
 * behind that account.
 */
export function ChatPage({
  profile,
  route,
  navigate,
}: {
  profile: Profile;
  route: Route;
  navigate: (r: Route) => void;
}) {
  const isSuper = profile.role === "Super User";
  const staff = isStaff(profile.role);

  const [cloud, setCloud] = useState<CloudDirectory | null>(null);
  const [superUid, setSuperUid] = useState<string | undefined>(undefined);
  // Bump every ~30s so the "online now" dots (derived from lastLogin) refresh.
  const [presenceTick, setPresenceTick] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () => {
      void fetchCloudDirectory().then((d) => {
        if (alive && d) setCloud(d);
      });
    };
    load();
    void fetchSuperUserAuthId().then((uid) => {
      if (alive && uid) setSuperUid(uid);
    });
    const refresh = window.setInterval(() => {
      if (!alive) return;
      load();
      setPresenceTick((n) => n + 1);
    }, 30_000);
    return () => {
      alive = false;
      window.clearInterval(refresh);
    };
  }, []);

  // Someone is "online now" if their last-online stamp landed in the last 5
  // minutes (App.tsx re-touches it every 4 minutes while the app is open).
  const isOnline = (p: Profile): boolean => {
    if (p.id === profile.id) return true; // you're always online in your own view
    if (!p.lastLogin) return false;
    return Date.now() - Date.parse(p.lastLogin) < 5 * 60_000;
  };
  // reference presenceTick so lint / memoization treats the closure as
  // depending on it — the value doesn't matter, only the re-render trigger
  void presenceTick;

  /** Every profile that has signed into the cloud (excluding self). */
  const people = useMemo<Profile[]>(() => {
    if (!cloud) return [];
    const all = cloud.profiles
      .filter((p) => p.id !== profile.id)
      // learners only see other learners and staff — never other learners' chats
      .filter((p) => (staff ? true : p.role === "Learner" || isStaff(p.role)))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    return all;
  }, [cloud, profile.id, staff]);

  /** Index by profile id AND by that profile's Supabase auth uid so we can
   *  resolve senders no matter which identifier a message carries. */
  const peopleByAny = useMemo(() => {
    const m = new Map<string, Profile>();
    for (const p of people) {
      m.set(p.id, p);
      const authId = p.cloudUserId ?? cloud?.owners[p.id];
      if (authId) m.set(authId, p);
    }
    // include the viewer so their own bubbles render with their own avatar
    m.set(profile.id, profile);
    if (profile.cloudUserId) m.set(profile.cloudUserId, profile);
    return m;
  }, [people, cloud, profile]);

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const nameFor = (id: string): string =>
    id === profile.id ? profile.name : peopleByAny.get(id)?.name ?? "Unknown";

  const threads = useChatThreads();

  // Filter to conversations relevant to the viewer:
  // - super user sees every conversation (moderation view)
  // - everyone else only sees their own conversations
  const visibleThreads = useMemo(
    () => (isSuper ? threads : threads.filter((t) => t.aId === profile.id || t.bId === profile.id)),
    [threads, isSuper, profile.id]
  );

  const [openWith, setOpenWith] = useState<string | null>(null);

  // deep-linkable ?studentId (reused from the shared Route)
  useEffect(() => {
    if (route.studentId && route.studentId !== profile.id) setOpenWith(route.studentId);
  }, [route.studentId, profile.id]);

  return (
    <div className="chat-page">
      <div className="eyebrow">
        <Icon name="chat" size={15} />
        Direct messages
      </div>
      <h1 className="page-title">Chat</h1>
      <p className="page-sub">
        Talk directly with anyone on the programme.{" "}
        {isSuper
          ? "As super user you can see every conversation for moderation and message anyone in the class."
          : "Your facilitator can see every conversation for moderation."}
      </p>

      <div className="chat-layout">
        <aside className="chat-side card">
          <ChatSidebar
            viewer={profile}
            people={people}
            threads={visibleThreads}
            nameFor={nameFor}
            isOnline={isOnline}
            openWith={openWith}
            onSelect={(id) => {
              setOpenWith(id);
              navigate({ page: "chat", studentId: id });
            }}
          />
        </aside>
        <section className="chat-main card">
          {openWith ? (
            <ChatThread
              me={profile}
              otherId={openWith}
              other={peopleById.get(openWith)}
              peopleByAny={peopleByAny}
              nameFor={nameFor}
              cloud={cloud}
              superUid={superUid}
              isOnline={isOnline}
            />
          ) : (
            <div className="chat-empty">
              <Icon name="chat" size={28} />
              <p className="muted" style={{ marginTop: 10 }}>
                Choose someone from the left to start a conversation.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ChatSidebar({
  viewer,
  people,
  threads,
  nameFor,
  isOnline,
  openWith,
  onSelect,
}: {
  viewer: Profile;
  people: Profile[];
  threads: ChatThreadInfo[];
  nameFor: (id: string) => string;
  isOnline: (p: Profile) => boolean;
  openWith: string | null;
  onSelect: (otherId: string) => void;
}) {
  const isSuper = viewer.role === "Super User";
  const [tab, setTab] = useState<"threads" | "people">("threads");
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<ChatThreadInfo | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const q = query.trim().toLowerCase();

  const threadRows = threads
    .map((t) => {
      const otherId = t.aId === viewer.id ? t.bId : t.bId === viewer.id ? t.aId : t.aId; // for super user viewing 3rd-party chats, show first party
      const secondaryId = t.aId === viewer.id ? t.aId : t.bId === viewer.id ? t.bId : t.bId;
      return { thread: t, otherId, secondaryId };
    })
    .filter((r) => {
      if (!q) return true;
      const a = nameFor(r.thread.aId).toLowerCase();
      const b = nameFor(r.thread.bId).toLowerCase();
      const body = r.thread.latest?.body.toLowerCase() ?? "";
      return a.includes(q) || b.includes(q) || body.includes(q);
    });

  const peopleRows = people.filter((p) => !q || p.name.toLowerCase().includes(q));

  return (
    <>
      <div className="chat-side-head">
        <div className="chat-tabs">
          <button
            className={`btn ghost sm${tab === "threads" ? " active" : ""}`}
            onClick={() => setTab("threads")}
          >
            <Icon name="chat" size={14} /> {isSuper ? "All chats" : "Conversations"}
          </button>
          <button
            className={`btn ghost sm${tab === "people" ? " active" : ""}`}
            onClick={() => setTab("people")}
          >
            <Icon name="people" size={14} /> New chat
          </button>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <input
            value={query}
            placeholder={tab === "threads" ? "Search chats…" : "Search people…"}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="chat-side-list">
        {tab === "threads" ? (
          threadRows.length === 0 ? (
            <p className="mini-note" style={{ padding: 12 }}>
              No conversations yet — open the New chat tab to start one.
            </p>
          ) : (
            threadRows.map(({ thread }) => (
              <ChatThreadRow
                key={thread.key}
                thread={thread}
                viewer={viewer}
                people={people}
                nameFor={nameFor}
                isOnline={isOnline}
                openWith={openWith}
                onSelect={onSelect}
                onDelete={isSuper ? () => setDeleting(thread) : undefined}
              />
            ))
          )
        ) : peopleRows.length === 0 ? (
          <p className="mini-note" style={{ padding: 12 }}>
            No matching people.
          </p>
        ) : (
          peopleRows.map((p) => (
            <button
              key={p.id}
              className={`chat-row${openWith === p.id ? " active" : ""}`}
              onClick={() => onSelect(p.id)}
            >
              <span className="chat-avatar">
                <Avatar profile={p} size={28} />
                {isOnline(p) && <span className="presence-dot" title="Online now" />}
              </span>
              <span className="chat-row-name">
                <strong>{p.name}</strong>
                <span className="mini-note">
                  {isOnline(p) ? <span className="presence-label">Online now · </span> : null}
                  {p.role}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
      {deleting && (
        <ConfirmModal
          title="Delete this conversation?"
          message={
            <>
              <p>
                All messages between <strong>{nameFor(deleting.aId)}</strong> and{" "}
                <strong>{nameFor(deleting.bId)}</strong> will be permanently removed for
                everyone.
              </p>
              <p style={{ marginTop: 8, fontSize: 13, color: "var(--ink-3)" }}>
                This cannot be undone.
              </p>
            </>
          }
          confirmLabel={deleteBusy ? "Deleting…" : "Delete conversation"}
          cancelLabel="Cancel"
          danger
          onCancel={() => (deleteBusy ? undefined : setDeleting(null))}
          onConfirm={async () => {
            if (deleteBusy) return;
            setDeleteBusy(true);
            const ok = await deleteChatThread(deleting.messages.map((m) => m.id));
            setDeleteBusy(false);
            if (ok) {
              logAudit(viewer, "qa.delete", `Deleted chat between ${nameFor(deleting.aId)} and ${nameFor(deleting.bId)}`);
              setDeleting(null);
            }
          }}
        />
      )}
    </>
  );
}

function ChatThreadRow({
  thread,
  viewer,
  people,
  nameFor,
  isOnline,
  openWith,
  onSelect,
  onDelete,
}: {
  thread: ChatThreadInfo;
  viewer: Profile;
  people: Profile[];
  nameFor: (id: string) => string;
  isOnline: (p: Profile) => boolean;
  openWith: string | null;
  onSelect: (otherId: string) => void;
  onDelete?: () => void;
}) {
  const isSuper = viewer.role === "Super User";
  const involves = thread.aId === viewer.id || thread.bId === viewer.id;
  // For your own chats, the "other party" is the one that isn't you.
  // For super-user moderation view, show both parties' names.
  const otherId = involves
    ? thread.aId === viewer.id
      ? thread.bId
      : thread.aId
    : thread.aId; // clicking a moderation-view row opens the a-side chat for read-only monitoring
  const bothLabel = `${nameFor(thread.aId)} · ${nameFor(thread.bId)}`;
  const unread = involves ? thread.unreadFor(viewer.id) : 0;
  const preview = thread.latest?.body ?? "";
  const otherProfile = people.find((p) => p.id === otherId);
  const otherOnline = otherProfile ? isOnline(otherProfile) : false;
  return (
    <div className="chat-row-wrap">
      <button
        className={`chat-row${openWith === otherId ? " active" : ""}${unread ? " has-unread" : ""}`}
        onClick={() => onSelect(otherId)}
        title={isSuper && !involves ? "Read-only monitoring view" : undefined}
      >
        <span className="chat-row-name">
          <strong>
            {involves ? nameFor(otherId) : bothLabel}
            {involves && otherOnline && (
              <span className="presence-dot inline" title="Online now" aria-label="Online now" />
            )}
          </strong>
          <span className="mini-note chat-preview">
            {thread.latest ? `${thread.latest.by === viewer.name ? "You" : thread.latest.by}: ${preview}` : "No messages yet"}
          </span>
        </span>
        <span className="chat-row-meta">
          {unread > 0 && <span className="chat-unread">{unread}</span>}
          <span className="mini-note">{thread.latest ? fmtWhen(thread.latest.at) : ""}</span>
        </span>
      </button>
      {onDelete && (
        <button
          type="button"
          className="chat-row-delete"
          title="Delete this conversation"
          aria-label="Delete this conversation"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  );
}

function ChatThread({
  me,
  otherId,
  other,
  peopleByAny,
  nameFor,
  cloud,
  superUid,
  isOnline,
}: {
  me: Profile;
  otherId: string;
  other?: Profile;
  peopleByAny: Map<string, Profile>;
  nameFor: (id: string) => string;
  cloud: CloudDirectory | null;
  superUid?: string;
  isOnline: (p: Profile) => boolean;
}) {
  // Cloud-only identity resolution: the other party's Supabase auth user id
  // is either stamped on their cloud profile (`cloudUserId`) or listed in the
  // `owners` map returned with `fetchCloudDirectory`. Super-user fallback
  // covers the case where their cloud row hasn't propagated yet.
  const otherAuthUserId = useMemo(() => {
    if (other?.cloudUserId) return other.cloudUserId;
    if (cloud && other) {
      const link = cloud.owners[other.id];
      if (link) return link;
    }
    if (cloud) {
      const link = cloud.owners[otherId];
      if (link) return link;
    }
    // Only the super user is dependably reachable via the admins table.
    if (other?.role === "Super User" && superUid) return superUid;
    return undefined;
  }, [cloud, other, otherId, superUid]);

  const { messages, send, markRead, edit } = useChat(me, {
    profileId: otherId,
    authUserId: otherAuthUserId,
  });
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    // mark unread incoming messages as read on the server
    if (messages.some((m) => m.byId !== me.id && !m.read)) {
      void markRead();
    }
  }, [messages, me.id, markRead]);

  function submit() {
    const t = text.trim();
    if (!t) return;
    void send(me, t);
    logAudit(me, "qa.post", `Messaged ${nameFor(otherId)}`);
    setText("");
  }

  const canSend = !!otherAuthUserId;

  const otherOnline = other ? isOnline(other) : false;

  return (
    <>
      <header className="chat-head">
        {other && (
          <span className="chat-avatar">
            <Avatar profile={other} size={30} />
            {otherOnline && <span className="presence-dot" title="Online now" />}
          </span>
        )}
        <span>
          <strong>{other?.name ?? nameFor(otherId)}</strong>
          <div className="mini-note">
            {otherOnline ? <span className="presence-label">Online now · </span> : null}
            {other?.role ?? "Unknown role"}
          </div>
        </span>
      </header>
      <div className="chat-messages" ref={scrollRef}>
        {!canSend && messages.length === 0 ? (
          <p className="mini-note" style={{ padding: 16, textAlign: "center" }}>
            This person hasn't signed in with their own cloud account yet — you can send them a
            message once they do (or once their email is linked in Users → Add User).
          </p>
        ) : messages.length === 0 ? (
          <p className="mini-note" style={{ padding: 16, textAlign: "center" }}>
            No messages yet — say hello.
          </p>
        ) : (
          messages.map((m) => {
            // Auth uid is the canonical sender identity. The map indexes cloud
            // profiles by BOTH auth uid AND profile id, so this single lookup
            // always finds the sender if we have their cloud record.
            const sender =
              peopleByAny.get(m.bySenderAuthId) ?? peopleByAny.get(m.byId) ?? other;
            return <ChatBubble key={m.id} msg={m} me={me} sender={sender} onEdit={edit} />;
          })
        )}
      </div>
      <div className="chat-compose">
        <textarea
          placeholder={canSend ? "Write a message…" : "Waiting for the recipient to activate their account…"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          disabled={!canSend}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          className="btn ghost sm"
          onClick={submit}
          disabled={!text.trim() || !canSend}
          title={canSend ? undefined : "Waiting for the recipient's cloud account"}
        >
          <Icon name="chevronRight" size={16} /> Send
        </button>
      </div>
    </>
  );
}

function ChatBubble({
  msg,
  me,
  sender,
  onEdit,
}: {
  msg: ChatMessage;
  me: Profile;
  sender?: Profile;
  onEdit: (msgId: string, newBody: string) => Promise<boolean>;
}) {
  const mine = msg.byId === me.id;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(msg.body);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editing) {
      setDraft(msg.body);
      // focus + move caret to end after render
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          el.selectionStart = el.selectionEnd = el.value.length;
        }
      });
    }
  }, [editing, msg.body]);

  async function save() {
    const next = draft.trim();
    if (!next || next === msg.body) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const ok = await onEdit(msg.id, next);
    setSaving(false);
    if (ok) setEditing(false);
  }

  const avatarProfile: Profile =
    sender ?? ({ id: msg.byId, name: msg.by, role: msg.role, createdAt: msg.at } as Profile);

  return (
    <div className={`chat-bubble-row${mine ? " mine" : ""}`}>
      {!mine && (
        <span className="chat-bubble-avatar">
          <Avatar profile={avatarProfile} size={28} />
        </span>
      )}
      <div className={`chat-bubble${mine ? " mine" : ""}`}>
        {!mine && <div className="chat-bubble-by">{msg.by}</div>}
        {editing ? (
          <div className="chat-bubble-edit">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.min(6, Math.max(2, draft.split("\n").length))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void save();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setEditing(false);
                }
              }}
            />
            <div className="chat-bubble-edit-actions">
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => void save()}
                disabled={saving || !draft.trim() || draft.trim() === msg.body}
              >
                <Icon name="checkCircle" size={14} /> Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="chat-bubble-body">{msg.body}</div>
            <div className="chat-bubble-at mini-note">
              {fmtWhen(msg.at)}
              {msg.editedAt && <span title={`Edited ${fmtWhen(msg.editedAt)}`}> · edited</span>}
            </div>
            {mine && (
              <button
                type="button"
                className="chat-bubble-edit-btn"
                title="Edit this message"
                aria-label="Edit this message"
                onClick={() => setEditing(true)}
              >
                <Icon name="design" size={12} />
              </button>
            )}
          </>
        )}
      </div>
      {mine && (
        <span className="chat-bubble-avatar">
          <Avatar profile={avatarProfile} size={28} />
        </span>
      )}
    </div>
  );
}

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return time;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })} · ${time}`;
}
