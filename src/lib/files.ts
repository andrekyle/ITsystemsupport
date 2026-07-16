import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from "./supabase";
import type { PoeDoc } from "../types";

/**
 * File handling: uploads go to the Supabase Storage "files" bucket when cloud
 * sync is configured (large files, shared across devices); in local-only mode
 * they fall back to inline data-URLs in localStorage.
 */

export const FILES_BUCKET = "files";

export function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function sanitize(name: string) {
  return name.replace(/[^\w.\-]+/g, "_").slice(-80);
}

/** Storage prefix for the signed-in account's private files. */
export async function userPrefix(): Promise<string> {
  if (!supabase) return "local";
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? "local";
}

/** Upload a file and return its document record (path in cloud mode, data-URL locally). */
export async function uploadFile(
  prefix: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<PoeDoc> {
  const meta = {
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
  if (supabase) {
    const path = `${prefix}/${Date.now().toString(36)}-${sanitize(file.name)}`;
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) throw new Error("Not signed in");
    // XMLHttpRequest is used instead of the supabase client so that real
    // upload progress events can be reported to the UI.
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/${FILES_BUCKET}/${path}`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY);
      xhr.setRequestHeader("x-upsert", "true");
      xhr.setRequestHeader("Content-Type", meta.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error(`Upload failed (${xhr.status})`));
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(file);
    });
    onProgress?.(100);
    return { ...meta, path };
  }
  onProgress?.(50);
  const data = await readAsDataURL(file);
  onProgress?.(100);
  return { ...meta, data };
}

/** Resolve a viewable URL for a document (data-URL or a 1-hour signed URL). */
export async function getFileUrl(doc: Pick<PoeDoc, "data" | "path">): Promise<string | null> {
  if (doc.data) return doc.data;
  if (doc.path && supabase) {
    const { data, error } = await supabase.storage
      .from(FILES_BUCKET)
      .createSignedUrl(doc.path, 3600);
    if (!error && data) return data.signedUrl;
  }
  return null;
}

/** Fetch the document contents as a Blob (used for ZIP exports). */
export async function getFileBlob(doc: Pick<PoeDoc, "data" | "path">): Promise<Blob | null> {
  if (doc.data) {
    try {
      return await (await fetch(doc.data)).blob();
    } catch {
      return null;
    }
  }
  if (doc.path && supabase) {
    const { data, error } = await supabase.storage.from(FILES_BUCKET).download(doc.path);
    if (!error && data) return data;
  }
  return null;
}

/** Trigger a browser download of the document. */
export async function downloadDoc(doc: PoeDoc): Promise<void> {
  if (doc.data) {
    const a = document.createElement("a");
    a.href = doc.data;
    a.download = doc.name;
    a.click();
    return;
  }
  if (doc.path && supabase) {
    const { data, error } = await supabase.storage
      .from(FILES_BUCKET)
      .createSignedUrl(doc.path, 300, { download: doc.name });
    if (!error && data) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = doc.name;
      a.click();
    }
  }
}

/** Remove the stored object backing a document (no-op for inline data-URLs). */
export async function deleteFile(path?: string): Promise<void> {
  if (path && supabase) {
    await supabase.storage.from(FILES_BUCKET).remove([path]).catch(() => {});
  }
}
