import { useCallback, useEffect, useRef, useState } from "react";
import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import type { Profile, Route } from "./types";
import type { Theme } from "./store";
import { getSession, getTheme, loadProfiles, setAccountAdmin, setAccountEmail, setSession, setTheme, THEME_CHANGE_EVENT, touchLastOnline, updateProfile, useProgress } from "./store";
import { SignIn } from "./components/SignIn";
import { CloudAuth, ResetPassword } from "./components/CloudAuth";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { EditingProvider } from "./components/EditingSidebar";
import { Dashboard, DiscoveryDashboard, ProgressPage } from "./pages/Dashboard";
import { CoursePage, ModulePage, UnitPage } from "./pages/Course";
import { AssessmentsPage, CalendarPage, DeliverablesPage, ResourcesPage } from "./pages/InfoPages";
import { PoePage } from "./pages/Poe";
import { ProfilePage, StudentsPage } from "./pages/People";
import { ChecklistPage } from "./pages/Checklist";
import { SectionDPage } from "./pages/Checklist";
import { AttendancePage } from "./pages/Attendance";
import { CompliancePage } from "./pages/Compliance";
import { AnalyticsPage } from "./pages/Analytics";
import { AdminDashboardPage } from "./pages/AdminDashboard";
import { CommunityPage } from "./pages/Community";
import { MemoriesPage } from "./pages/Memories";
import { ChatPage } from "./pages/Chat";
import { FormsPage } from "./pages/Forms";
import { TrackerReportPage } from "./pages/TrackerReport";
import { ReportsPage } from "./pages/Reports";
import { VotingPage } from "./pages/Voting";
import { OnboardingPage } from "./pages/Onboarding";
import { cloudEnabled, supabase } from "./lib/supabase";
import { flushPendingCloudWrites, installSync, startSync, stopSync, wipeLocalData } from "./lib/sync";
import { logAudit } from "./lib/audit";
import { Icon } from "./icons";
import { authTenant, TENANT, TENANT_ID } from "./lib/tenant";
import { startPresence } from "./lib/presence";
import { showAppDialog } from "./lib/dialogs";
import { profileMatchesCloudIdentity, resolveCloudProfile } from "./lib/cloudProfile";

// mirror every itss.* localStorage write to the cloud (no-op until signed in)
installSync();

const ROUTE_KEY = "itss.route";
const VALID_PAGES = new Set<Route["page"]>([
  "dashboard",
  "adminDashboard",
  "course",
  "module",
  "unit",
  "assessments",
  "deliverables",
  "calendar",
  "progress",
  "poe",
  "resources",
  "profile",
  "students",
  "checklist",
  "sectiond",
  "attendance",
  "voting",
  "compliance",
  "analytics",
  "community",
  "memories",
  "chat",
  "forms",
  "trackerReport",
  "reports",
  "onboarding",
]);

function parseRoute(value: unknown): Route | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.page !== "string" || !VALID_PAGES.has(candidate.page as Route["page"])) return null;
  return {
    page: candidate.page as Route["page"],
    ...(typeof candidate.moduleId === "string" ? { moduleId: candidate.moduleId } : {}),
    ...(typeof candidate.unitId === "string" ? { unitId: candidate.unitId } : {}),
    ...(typeof candidate.studentId === "string" ? { studentId: candidate.studentId } : {}),
    ...(typeof candidate.packId === "string" ? { packId: candidate.packId } : {}),
  };
}

function routeFromUrl(): Route | null {
  try {
    const encoded = new URLSearchParams(window.location.search).get("itssRoute");
    return encoded ? parseRoute(JSON.parse(encoded)) : null;
  } catch {
    return null;
  }
}

function routeUrl(route: Route): string {
  const url = new URL(window.location.href);
  url.searchParams.set("itssRoute", JSON.stringify(route));
  return `${url.pathname}${url.search}${url.hash}`;
}

function loadRoute(): Route {
  const fromUrl = routeFromUrl();
  if (fromUrl) return fromUrl;
  try {
    const saved = parseRoute(JSON.parse(localStorage.getItem(ROUTE_KEY) || "null"));
    if (saved) return saved;
  } catch {
    /* fall through to default */
  }
  return { page: "dashboard" };
}

function Shell({
  profile,
  theme,
  onToggleTheme,
  onSignOut,
  onUpdateProfile,
}: {
  profile: Profile;
  theme: Theme;
  onToggleTheme: () => void;
  onSignOut: () => void;
  onUpdateProfile: (patch: Partial<Profile>) => void;
}) {
  // on phones/tablets the sidebar starts collapsed so content gets the full
  // width; below this breakpoint the sidebar behaves as an overlay drawer
  const MOBILE_BP = 860;
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < MOBILE_BP);
  const [route, setRoute] = useState<Route>(loadRoute);
  const { state, toggleActivity, saveQuizResult, setLogbookField, saveExerciseResult } = useProgress(profile.id);

  // in-app navigation pushes a browser history entry so back/forward work;
  // on mobile the navigation drawer closes so the destination page is visible
  const navigate = useCallback((r: Route) => {
    window.history.pushState(r, "", routeUrl(r));
    setRoute(r);
    if (window.innerWidth < MOBILE_BP) setCollapsed(true);
  }, []);
  useEffect(() => {
    // seed the current history entry with the initial route
    const initialRoute = loadRoute();
    window.history.replaceState(initialRoute, "", routeUrl(initialRoute));
    const onPop = (e: PopStateEvent) => {
      const r = parseRoute(e.state) ?? routeFromUrl();
      if (r) setRoute(r);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    localStorage.setItem(ROUTE_KEY, JSON.stringify(route));
    // scroll content to top on navigation
    document.querySelector(".content")?.scrollTo({ top: 0 });
  }, [route]);

  return (
    <div className="app">
      <Header
        profile={profile}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onToggleSidebar={() => setCollapsed((c) => !c)}
        onSignOut={onSignOut}
        onUpdateProfile={onUpdateProfile}
        onOpenProfile={() => navigate({ page: "profile" })}
        onOpenUnit={(us) => navigate({ page: "unit", unitId: us })}
        navigate={navigate}
      />
      <EditingProvider>
      <div className="body">
        <Sidebar
          collapsed={collapsed}
          route={route}
          progress={state}
          profile={profile}
          navigate={navigate}
        />
        {!collapsed && (
          <button
            className="side-scrim"
            aria-label="Close navigation"
            onClick={() => setCollapsed(true)}
          />
        )}
        <main className="content">
          <div className="content-inner">
            {route.page === "adminDashboard" && profile.role === "Super User" && <AdminDashboardPage profile={profile} navigate={navigate} />}
            {route.page === "dashboard" && (
              TENANT_ID === "discovery" ? (
                <DiscoveryDashboard profile={profile} progress={state} navigate={navigate} />
              ) : (
                <Dashboard profile={profile} progress={state} navigate={navigate} />
              )
            )}
            {route.page === "course" && <CoursePage progress={state} navigate={navigate} profile={profile} />}
            {route.page === "module" && route.moduleId && (
              <ModulePage moduleId={route.moduleId} profile={profile} progress={state} navigate={navigate} />
            )}
            {route.page === "unit" && route.unitId && (
              <UnitPage
                unitId={route.unitId}
                profile={profile}
                progress={state}
                toggleActivity={toggleActivity}
                saveQuizResult={saveQuizResult}
                setLogbookField={setLogbookField}
                saveExerciseResult={saveExerciseResult}
                navigate={navigate}
              />
            )}
            {route.page === "progress" && <ProgressPage profile={profile} progress={state} navigate={navigate} />}
            {route.page === "poe" && <PoePage profile={profile} />}
            {route.page === "checklist" && <ChecklistPage profile={profile} />}
            {route.page === "sectiond" && <SectionDPage profile={profile} />}
            {route.page === "profile" && (
              <ProfilePage profile={profile} onUpdateProfile={onUpdateProfile} />
            )}
            {route.page === "students" && (
              <StudentsPage profile={profile} route={route} navigate={navigate} />
            )}
            {route.page === "assessments" && <AssessmentsPage profile={profile} />}
            {route.page === "deliverables" && <DeliverablesPage />}
            {route.page === "calendar" && <CalendarPage navigate={navigate} progress={state} profile={profile} />}
            {route.page === "attendance" && (
              <AttendancePage profile={profile} onUpdateProfile={onUpdateProfile} />
            )}
            {route.page === "voting" && <VotingPage profile={profile} />}
            {route.page === "compliance" && (
              <CompliancePage profile={profile} progress={state} navigate={navigate} />
            )}
            {route.page === "analytics" && <AnalyticsPage profile={profile} navigate={navigate} />}
            {route.page === "community" && <CommunityPage profile={profile} navigate={navigate} />}
            {route.page === "memories" && <MemoriesPage profile={profile} />}
            {route.page === "chat" && (
              <ChatPage profile={profile} route={route} navigate={navigate} />
            )}
            {route.page === "forms" && (
              <FormsPage
                profile={profile}
                onUpdateProfile={onUpdateProfile}
                route={route}
                navigate={navigate}
              />
            )}
            {route.page === "trackerReport" && <TrackerReportPage profile={profile} />}
            {route.page === "reports" && profile.role === "Super User" && (
              <ReportsPage profile={profile} />
            )}
            {route.page === "onboarding" && (
              <OnboardingPage profile={profile} route={route} navigate={navigate} />
            )}
            {route.page === "resources" && <ResourcesPage />}
          </div>
        </main>
      </div>
      </EditingProvider>
      {profile.role === "Super User" && route.page !== "reports" && (
        <button
          type="button"
          className="ai-fab"
          title="AI Assistant"
          aria-label="Open the AI Assistant"
          onClick={() => navigate({ page: "reports" })}
        >
          <Icon name="robot" size={34} />
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [cloudState, setCloudState] = useState<"loading" | "signedout" | "recovery" | "ready">(
    cloudEnabled ? "loading" : "ready"
  );
  const syncedUser = useRef<string | null>(null);
  const syncedEmail = useRef<string | null>(null);
  const recovering = useRef(false);
  const syncReady = useRef(false);

  useEffect(() => {
    if (!supabase) return;
    const sb = supabase;
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // arrived from a password-reset email — let the user set a new password first
        recovering.current = true;
        setAccountEmail(session?.user?.email);
        setCloudState("recovery");
        return;
      }
      if (session?.user) {
        if (!recovering.current && !syncReady.current) setCloudState("loading");
        const accountTenant = authTenant(session.user);
        if (!accountTenant) {
          // Accounts created before multi-tenant support have no tenant in
          // their auth metadata.  Assign them to the branded site they used
          // to sign in, then wait for USER_UPDATED before loading cloud data.
          // This must be deferred because Supabase auth calls made directly
          // inside onAuthStateChange can deadlock on the client's auth lock.
          const legacyUserId = session.user.id;
          window.setTimeout(() => {
            if (syncedUser.current && syncedUser.current !== legacyUserId) return;
            void sb.auth.updateUser({
              data: { ...session.user.user_metadata, tenant_id: TENANT_ID },
            }).then(({ error }) => {
              if (!error) return;
              try {
                sessionStorage.setItem(
                  "itss.auth-error",
                  "Your older account could not be linked to this learning site. Please try again or ask your facilitator for help."
                );
              } catch {
                // The sign-in screen still works when storage is unavailable.
              }
              void sb.auth.signOut();
            });
          }, 0);
          return;
        }
        if (accountTenant !== TENANT_ID) {
          try {
            sessionStorage.setItem(
              "itss.auth-error",
              `This account belongs to a different learning site and cannot sign in to ${TENANT.name}.`
            );
          } catch {
            // The sign-in screen still works when storage is unavailable.
          }
          void sb.auth.signOut();
          return;
        }
        setAccountEmail(session.user.email);
        syncedEmail.current = session.user.email?.trim().toLowerCase() ?? null;
        if (syncedUser.current !== session.user.id) {
          syncReady.current = false;
          setAccountAdmin(false);
          if (!recovering.current) setCloudState("loading");
          syncedUser.current = session.user.id;
          const authUserId = session.user.id;
          // Supabase warns against starting further client operations directly
          // inside onAuthStateChange: they may wait on the auth callback's lock
          // and leave the app on "Loading your data..." forever. Defer cloud
          // initialization until after the callback has returned.
          window.setTimeout(() => {
            if (syncedUser.current !== authUserId) return;
            const adminCheck = sb
              .from("admins")
              .select("user_id")
              .eq("user_id", authUserId)
              .eq("tenant_id", TENANT_ID)
              .maybeSingle()
              .then(
                ({ data }) => setAccountAdmin(!!data),
                () => setAccountAdmin(false)
              );
            const selectedCourse = localStorage.getItem("itss.activeCourse");
            const selectedCourseKey = selectedCourse?.startsWith("custom-")
              ? `itss.course.${selectedCourse}.shared`
              : null;
            const previousCourse = selectedCourseKey
              ? localStorage.getItem(selectedCourseKey)
              : null;
            let finished = false;
            const showApp = () => {
              if (finished || syncedUser.current !== authUserId) return;
              finished = true;
              syncReady.current = true;
              if (!recovering.current) setCloudState("ready");
            };
            // Cloud data normally loads immediately. If the network or a
            // database request stalls, open the app with cached/local data;
            // SignIn continues watching for the cloud profile to arrive.
            const fallback = window.setTimeout(showApp, 8_000);
            void Promise.allSettled([startSync(authUserId), adminCheck]).then(() => {
              window.clearTimeout(fallback);
              if (syncedUser.current !== authUserId) return;
              if (
                selectedCourseKey &&
                previousCourse !== localStorage.getItem(selectedCourseKey)
              ) {
                location.reload();
                return;
              }
              showApp();
            });
          }, 0);
        }
      } else {
        setAccountEmail(null);
        setAccountAdmin(false);
        if (event === "SIGNED_OUT") {
          // prevent one account's local data leaking into the next sign-in
          stopSync();
          wipeLocalData();
        }
        syncedUser.current = null;
        syncedEmail.current = null;
        syncReady.current = false;
        recovering.current = false;
        setCloudState("signedout");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (cloudState === "loading") {
    return (
      <div className="gate">
        <div className="gate-card" style={{ textAlign: "center" }}>
          Loading your data…
        </div>
      </div>
    );
  }
  if (cloudState === "signedout") return <CloudAuth />;
  if (cloudState === "recovery")
    return (
      <ResetPassword
        onDone={() => {
          recovering.current = false;
          setCloudState(syncReady.current ? "ready" : "loading");
        }}
      />
    );
  return (
    <LocalApp
      key={syncedUser.current ?? "local"}
      cloudIdentity={
        syncedUser.current
          ? { userId: syncedUser.current, email: syncedEmail.current }
          : null
      }
    />
  );
}

function LocalApp({
  cloudIdentity,
}: {
  cloudIdentity: { userId: string; email: string | null } | null;
}) {
  const [profile, setProfile] = useState<Profile | null>(() => {
    if (cloudIdentity) return resolveCloudProfile(loadProfiles(), cloudIdentity);
    const id = getSession();
    return id ? loadProfiles().find((p) => p.id === id) ?? null : null;
  });
  const [theme, setThemeState] = useState<Theme>(getTheme);
  const fluentTheme = theme === "dark" ? webDarkTheme : webLightTheme;

  // Supabase has already verified the account password. Open the matching
  // in-app profile immediately instead of showing the legacy device profile
  // picker and requiring a second sign-in click.
  useEffect(() => {
    if (profile || !cloudIdentity) return;
    const openCloudProfile = () => {
      const profiles = loadProfiles();
      const match = resolveCloudProfile(profiles, cloudIdentity);
      if (!match) return;
      setSession(match.id);
      if (match.cloudUserId !== cloudIdentity.userId) {
        const patched = updateProfile(match.id, { cloudUserId: cloudIdentity.userId });
        setProfile(patched ?? match);
      } else {
        setProfile(match);
      }
    };
    openCloudProfile();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "itss.profiles") openCloudProfile();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", openCloudProfile);
    const timer = window.setInterval(openCloudProfile, 1000);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", openCloudProfile);
      window.clearInterval(timer);
    };
  }, [cloudIdentity, profile]);

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event: Event) => {
      const nextTheme = (event as CustomEvent<Theme>).detail;
      if (nextTheme === "light" || nextTheme === "dark") setThemeState(nextTheme);
    };
    window.addEventListener(THEME_CHANGE_EVENT, syncTheme);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
  }, []);

  useEffect(() => {
    if (!profile) return;
    // Refresh the "last online" stamp when restoring an existing signed-in
    // session, then keep it fresh while the app stays open so an active user
    // never decays out of the "Online now" window.
    setSession(profile.id);
    // Stamp our Supabase auth uid onto our profile if we haven't yet — needed
    // so other users can direct-message us. This covers the case where we were
    // already signed in before the cloudUserId feature existed.
    if (supabase && !profile.cloudUserId) {
      void supabase.auth.getUser().then(({ data }) => {
        const uid = data.user?.id;
        if (uid) {
          const patched = updateProfile(profile.id, { cloudUserId: uid });
          if (patched) setProfile(patched);
        }
      });
    }
    const tick = () => touchLastOnline(profile.id);
    const stopPresence = startPresence(profile);
    const timer = window.setInterval(tick, 4 * 60 * 1000);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", tick);
      stopPresence();
    };
  }, [profile?.id]);

  if (!profile) {
    return (
      <SignIn
        cloudIdentity={cloudIdentity}
        onSignIn={async (p) => {
          if (cloudIdentity && !profileMatchesCloudIdentity(p, cloudIdentity)) {
            await showAppDialog("This profile does not belong to the signed-in account. Use your own learner profile or ask your facilitator to check its email address.");
            return;
          }
          setSession(p.id);
          // Stamp our Supabase auth uid onto this profile so others can address
          // us in chat as soon as we sign in — the id syncs to cloud storage
          // and every viewer reads it directly from the profile row.
          let signed = p;
          if (supabase) {
            try {
              const { data } = await supabase.auth.getUser();
              const uid = data.user?.id;
              if (uid && p.cloudUserId !== uid) {
                const patched = updateProfile(p.id, { cloudUserId: uid });
                if (patched) signed = patched;
              }
            } catch {
              /* offline — cloud stamp will happen on the next sign-in */
            }
          }
          setProfile(signed);
        }}
      />
    );
  }

  return (
    <FluentProvider theme={fluentTheme} className="itss-fluent-provider">
    <Shell
      profile={profile}
      theme={theme}
      onToggleTheme={() => setThemeState((t) => (t === "dark" ? "light" : "dark"))}
      onSignOut={async () => {
        if (supabase) {
          // Commit a focused field's blur handler, then ensure recent debounced
          // edits reach the cloud before SIGNED_OUT wipes this device's copy.
          const active = document.activeElement;
          if (active instanceof HTMLElement) active.blur();
          await new Promise<void>(resolve => window.setTimeout(resolve, 0));
          try {
            await flushPendingCloudWrites();
          } catch (error) {
            await showAppDialog(error instanceof Error
              ? `${error.message} You have not been signed out; try again when your connection is stable.`
              : "Your latest work could not be saved. You have not been signed out.");
            return;
          }
          logAudit(profile, "auth.signout", "Signed out");
          // The audit write is best-effort and must not put learner data back
          // at risk after the guarded flush above.
          await flushPendingCloudWrites().catch(() => {});
          setSession(null);
          const { error } = await supabase.auth.signOut();
          if (error) {
            // Keep the current profile open when the cloud session could not
            // be ended; otherwise the auto-profile resolver would reopen it.
            setSession(profile.id);
            await showAppDialog("Sign out failed. Check your connection and try again.");
          }
        } else {
          logAudit(profile, "auth.signout", "Signed out");
          setSession(null);
          setProfile(null);
        }
      }}
      onUpdateProfile={(patch) => {
        const updated = updateProfile(profile.id, patch);
        if (updated) setProfile(updated);
      }}
    />
    </FluentProvider>
  );
}
