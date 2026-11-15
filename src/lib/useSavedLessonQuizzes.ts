import { useEffect, useState } from "react";
import { cloudEnabled } from "./supabase";
import { fetchCloudLessonQuizzes } from "./directory";
import { combineLessonQuizEvidence, localLessonQuizEvidence, type LessonQuizEvidence } from "./academicEvidence";

/** Directory polling must not clear saved answers or restart an in-flight lookup. */
export function useSavedLessonQuizzes(profileIds: Iterable<string>, refresh = 0) {
  const source = JSON.stringify([...new Set(profileIds)].sort());
  const [state, setState] = useState<{ source: string; lessons: LessonQuizEvidence; loading: boolean; error: string }>(() => ({
    source, lessons: localLessonQuizEvidence(JSON.parse(source)), loading: cloudEnabled, error: "",
  }));
  useEffect(() => {
    let active = true;
    const ids: string[] = JSON.parse(source);
    const local = localLessonQuizEvidence(ids);
    setState(previous => ({ source, lessons: previous.source === source ? combineLessonQuizEvidence(previous.lessons, local) : local, loading: cloudEnabled, error: "" }));
    if (!cloudEnabled) return;
    const receive = (saved: LessonQuizEvidence) => {
      if (active) setState(previous => ({ ...previous, lessons: combineLessonQuizEvidence(previous.lessons, local, saved) }));
    };
    void fetchCloudLessonQuizzes(ids, receive).then(saved => {
      if (active) setState(previous => ({ ...previous, lessons: combineLessonQuizEvidence(local, saved) }));
    }).catch(error => {
      if (active) setState(previous => ({ ...previous, error: error instanceof Error ? error.message : "Saved lesson quizzes could not be loaded." }));
    }).finally(() => { if (active) setState(previous => ({ ...previous, loading: false })); });
    return () => { active = false; };
  }, [source, refresh]);
  return state.source === source ? state : { source, lessons: {}, loading: cloudEnabled, error: "" };
}
