import { useCallback, useEffect, useRef, useState } from "react";
import type { Profile, Route } from "./types";
import type { Theme } from "./store";
import { getSession, getTheme, loadProfiles, setSession, setTheme, updateProfile, useProgress } from "./store";
import { SignIn } from "./components/SignIn";
import { CloudAuth } from "./components/CloudAuth";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Dashboard, ProgressPage } from "./pages/Dashboard";
import { CoursePage, ModulePage, UnitPage } from "./pages/Course";
import { AssessmentsPage, CalendarPage, DeliverablesPage, ResourcesPage } from "./pages/InfoPages";
import { PoePage } from "./pages/Poe";
import { ProfilePage, StudentsPage } from "./pages/People";
import { ChecklistPage } from "./pages/Checklist";
import { SectionDPage } from "./pages/Checklist";
import { cloudEnabled, supabase } from "./lib/supabase";
import { installSync, startSync, stopSync, wipeLocalData } from "./lib/sync";

// mirror every itss.* localStorage write to the cloud (no-op until signed in)
installSync();

const ROUTE_KEY = "itss.route";
const VALID_PAGES = new Set([
  "dashboard",
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
]);

function loadRoute(): Route {
  try {
    const saved = JSON.parse(localStorage.getItem(ROUTE_KEY) || "null");
    if (saved && VALID_PAGES.has(saved.page)) return saved as Route;
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
  const [collapsed, setCollapsed] = useState(false);
  const [route, setRoute] = useState<Route>(loadRoute);
  const { state, toggleActivity, saveQuizResult, setLogbookField } = useProgress(profile.id);

  // in-app navigation pushes a browser history entry so back/forward work
  const navigate = useCallback((r: Route) => {
    window.history.pushState(r, "");
    setRoute(r);
  }, []);

  useEffect(() => {
    // seed the current history entry with the initial route
    window.history.replaceState(loadRoute(), "");
    const onPop = (e: PopStateEvent) => {
      const r = e.state as Route | null;
      if (r && VALID_PAGES.has(r.page)) setRoute(r);
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
      />
      <div className="body">
        <Sidebar
          collapsed={collapsed}
          route={route}
          progress={state}
          profile={profile}
          navigate={navigate}
        />
        <main className="content">
          <div className="content-inner">
            {route.page === "dashboard" && (
              <Dashboard profile={profile} progress={state} navigate={navigate} />
            )}
            {route.page === "course" && <CoursePage progress={state} navigate={navigate} />}
            {route.page === "module" && route.moduleId && (
              <ModulePage moduleId={route.moduleId} progress={state} navigate={navigate} />
            )}
            {route.page === "unit" && route.unitId && (
              <UnitPage
                unitId={route.unitId}
                profile={profile}
                progress={state}
                toggleActivity={toggleActivity}
                saveQuizResult={saveQuizResult}
                setLogbookField={setLogbookField}
                navigate={navigate}
              />
            )}
            {route.page === "progress" && <ProgressPage progress={state} navigate={navigate} />}
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
            {route.page === "calendar" && <CalendarPage />}
            {route.page === "resources" && <ResourcesPage />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [cloudState, setCloudState] = useState<"loading" | "signedout" | "ready">(
    cloudEnabled ? "loading" : "ready"
  );
  const syncedUser = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        if (syncedUser.current !== session.user.id) {
          syncedUser.current = session.user.id;
          void startSync(session.user.id).then(() => setCloudState("ready"));
        }
      } else {
        if (event === "SIGNED_OUT") {
          // prevent one account's local data leaking into the next sign-in
          stopSync();
          wipeLocalData();
        }
        syncedUser.current = null;
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
  return <LocalApp key={syncedUser.current ?? "local"} />;
}

function LocalApp() {
  const [profile, setProfile] = useState<Profile | null>(() => {
    const id = getSession();
    return id ? loadProfiles().find((p) => p.id === id) ?? null : null;
  });
  const [theme, setThemeState] = useState<Theme>(getTheme);

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  if (!profile) {
    return (
      <SignIn
        onSignIn={(p) => {
          setSession(p.id);
          setProfile(p);
        }}
      />
    );
  }

  return (
    <Shell
      profile={profile}
      theme={theme}
      onToggleTheme={() => setThemeState((t) => (t === "dark" ? "light" : "dark"))}
      onSignOut={() => {
        setSession(null);
        setProfile(null);
      }}
      onUpdateProfile={(patch) => {
        const updated = updateProfile(profile.id, patch);
        if (updated) setProfile(updated);
      }}
    />
  );
}
