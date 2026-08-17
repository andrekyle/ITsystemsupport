import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../icons";
import type { Profile, Route } from "../types";
import { isStaff } from "../types";
import {
  loadProfiles,
  useChat,
  useChatThreads,
  type ChatMessage,
  type ChatThreadInfo,
} from "../store";
import { fetchCloudDirectory, fetchSuperUserAuthId, resolveCloudLink } from "../lib/directory";
import { mergeProfileWithCloud, remoteOnlyProfiles } from "../lib/directory";
import type { CloudDirectory } from "../lib/directory";
import { Avatar } from "../components/Avatar";
import { logAudit } from "../lib/audit";

/**
 * Direct messages: 1-to-1 chat between any two people on the course.
 * - Learners can chat with other learners and staff.
 * - Super users can open a chat with anyone and see every conversation.
 * - Each conversation is stored as one shared_state row (`itss.chat.<a>~~<b>.shared`)
 *   so both sides — and moderators — always see the same thread.
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

  // People I can chat with (local + cloud, deduped, self excluded)
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

  const people = useMemo(() => {
    const local = loadProfiles();
    const remote = remoteOnlyProfiles(local, cloud?.profiles ?? []);
    const all = [
      ...local.map((p) => mergeProfileWithCloud(p, cloud ?? undefined)),
      ...remote,
    ]
      .filter((p) => p.id !== profile.id)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    // learners can only see other learners + staff; they don't need to see other people's private chats
    return staff ? all : all.filter((p) => p.role === "Learner" || isStaff(p.role));
  }, [cloud, profile.id, staff]);

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  // include the viewer so their own chats render their own name/avatar for super users
  const nameFor = (id: string): string =>
    id === profile.id ? profile.name : peopleById.get(id)?.name ?? "Unknown";

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
    <>
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
    </>
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
}: {
  thread: ChatThreadInfo;
  viewer: Profile;
  people: Profile[];
  nameFor: (id: string) => string;
  isOnline: (p: Profile) => boolean;
  openWith: string | null;
  onSelect: (otherId: string) => void;
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
  );
}

function ChatThread({
  me,
  otherId,
  other,
  nameFor,
  cloud,
  superUid,
  isOnline,
}: {
  me: Profile;
  otherId: string;
  other?: Profile;
  nameFor: (id: string) => string;
  cloud: CloudDirectory | null;
  superUid?: string;
  isOnline: (p: Profile) => boolean;
}) {
  // Resolve the other party's Supabase auth user id (identity-aware). The
  // chat table is keyed by real auth ids so RLS can enforce privacy.
  //
  // Priority:
  //   1. profile.cloudUserId (stamped when the admin added them via Add User,
  //      or when they signed in on this device with cloud auth)
  //   2. identity-matched cloud directory (works once they've signed in)
  //   3. direct id lookup in cloud.owners
  //   4. the sole super user's auth uid from the `admins` table — used when
  //      the target is the designated super user but no identity path linked
  //      them to a cloud row yet.
  const otherAuthUserId = useMemo(() => {
    if (other?.cloudUserId) return other.cloudUserId;
    if (cloud) {
      if (other) {
        const link = resolveCloudLink(other, cloud)?.owner ?? cloud.owners[other.id];
        if (link) return link;
      } else {
        const link = cloud.owners[otherId];
        if (link) return link;
      }
    }
    // Super-user fallback: only one account holds this role, and every
    // signed-in user can read the `admins` table.
    if (other?.role === "Super User" && superUid) return superUid;
    return undefined;
  }, [cloud, other, otherId, superUid]);

  const { messages, send, markRead } = useChat(me, {
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
          messages.map((m) => <ChatBubble key={m.id} msg={m} me={me} />)
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

function ChatBubble({ msg, me }: { msg: ChatMessage; me: Profile }) {
  const mine = msg.byId === me.id;
  return (
    <div className={`chat-bubble${mine ? " mine" : ""}`}>
      {!mine && <div className="chat-bubble-by">{msg.by}</div>}
      <div className="chat-bubble-body">{msg.body}</div>
      <div className="chat-bubble-at mini-note">{fmtWhen(msg.at)}</div>
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
