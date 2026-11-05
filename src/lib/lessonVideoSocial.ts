import { supabase } from "./supabase";

export interface SharedVideoComment {
  id: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  likedBy: string[];
}

export interface VideoSocialState {
  viewerId: string;
  likes: number;
  liked: boolean;
  comments: SharedVideoComment[];
}

function client() {
  if (!supabase) throw new Error("Shared video discussions require the cloud connection.");
  return supabase;
}

function failure(error: { message: string; code?: string } | null, action: string) {
  if (!error) return;
  if (error.code === "42P01" || error.code === "PGRST205")
    throw new Error("Shared video discussions are not installed yet. Apply the lesson_video_social database migration.");
  throw new Error(`${action}: ${error.message}`);
}

async function currentUserId() {
  const { data, error } = await client().auth.getUser();
  failure(error, "Could not verify your account");
  if (!data.user) throw new Error("Sign in to join the video discussion.");
  return data.user.id;
}

export async function loadVideoSocial(videoId: string): Promise<VideoSocialState> {
  const userId = await currentUserId();
  const db = client();
  const [likes, comments] = await Promise.all([
    db.from("lesson_video_likes").select("user_id").eq("video_id", videoId),
    db.from("lesson_video_comments").select("id,parent_id,user_id,author_name,body,created_at").eq("video_id", videoId).order("created_at", { ascending: true }),
  ]);
  failure(likes.error, "Could not load video likes");
  failure(comments.error, "Could not load video comments");
  const rows = comments.data ?? [];
  const ids = rows.map(row => row.id);
  const reactions = ids.length
    ? await db.from("lesson_video_comment_likes").select("comment_id,user_id").in("comment_id", ids)
    : { data: [], error: null };
  failure(reactions.error, "Could not load comment likes");
  return {
    viewerId: userId,
    likes: likes.data?.length ?? 0,
    liked: likes.data?.some(row => row.user_id === userId) ?? false,
    comments: rows.map(row => ({
      id: row.id,
      parentId: row.parent_id,
      authorId: row.user_id,
      authorName: row.author_name,
      text: row.body,
      createdAt: row.created_at,
      likedBy: (reactions.data ?? []).filter(reaction => reaction.comment_id === row.id).map(reaction => reaction.user_id),
    })),
  };
}

export async function setVideoLike(videoId: string, liked: boolean) {
  const userId = await currentUserId();
  const query = liked
    ? client().from("lesson_video_likes").upsert({ video_id: videoId, user_id: userId }, { onConflict: "tenant_id,video_id,user_id", ignoreDuplicates: true })
    : client().from("lesson_video_likes").delete().eq("video_id", videoId).eq("user_id", userId);
  const { error } = await query;
  failure(error, "Could not save your video like");
}

export async function postVideoComment(videoId: string, text: string, authorName: string, parentId: string | null = null) {
  const userId = await currentUserId();
  const { error } = await client().from("lesson_video_comments").insert({
    video_id: videoId, user_id: userId, author_name: authorName, body: text, parent_id: parentId,
  });
  failure(error, "Could not post your comment");
}

export async function editVideoComment(commentId: string, text: string) {
  const { error } = await client().from("lesson_video_comments").update({ body: text, updated_at: new Date().toISOString() }).eq("id", commentId);
  failure(error, "Could not edit your comment");
}

export async function setCommentLike(commentId: string, liked: boolean) {
  const userId = await currentUserId();
  const query = liked
    ? client().from("lesson_video_comment_likes").upsert({ comment_id: commentId, user_id: userId }, { onConflict: "tenant_id,comment_id,user_id", ignoreDuplicates: true })
    : client().from("lesson_video_comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
  const { error } = await query;
  failure(error, "Could not save your comment like");
}
