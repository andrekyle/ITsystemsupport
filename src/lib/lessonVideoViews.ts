import { supabase } from "./supabase";

export async function recordLessonVideoView(videoId: string): Promise<number> {
  if (!supabase) {
    throw new Error("Platform view counts are unavailable while offline.");
  }

  const { data, error } = await supabase.rpc("record_lesson_video_view", {
    p_video_id: videoId,
  });
  if (error) {
    if (error.code === "PGRST202") {
      throw new Error("Video views are unavailable: an administrator must apply the lesson video views database migration. Playback and video assessment are still available.");
    }
    throw new Error(`The video view could not be recorded: ${error.message}`);
  }

  const count = typeof data === "number" ? data : Number(data);
  if (!Number.isSafeInteger(count) || count < 1) {
    throw new Error("The platform returned an invalid video view count.");
  }
  return count;
}
