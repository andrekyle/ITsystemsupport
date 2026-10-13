import { supabase } from "./supabase";

export interface LessonVideoViewCount {
  /** Platform total; each signed-in learner counts at most once a day per video. */
  views: number;
  /** True when this open counted as the learner's view for today. */
  counted: boolean;
}

export async function recordLessonVideoView(videoId: string): Promise<LessonVideoViewCount> {
  if (!supabase) {
    throw new Error("Platform view counts are unavailable while offline.");
  }

  const { data, error } = await supabase.rpc("record_lesson_video_daily_view", {
    p_video_id: videoId,
  });
  if (error) {
    if (error.code === "PGRST202") {
      throw new Error("Video views are unavailable: an administrator must apply supabase/migrations/20261013_lesson_video_daily_view_rpc.sql so each learner counts once a day. Playback and video assessment are still available.");
    }
    throw new Error(`The video view could not be recorded: ${error.message}`);
  }

  const result = data as { views?: unknown; counted?: unknown } | null;
  const views = typeof result?.views === "number" ? result.views : Number(result?.views);
  if (!result || typeof result.counted !== "boolean" || !Number.isSafeInteger(views) || views < 1) {
    throw new Error("The platform returned an invalid video view count.");
  }
  return { views, counted: result.counted };
}
