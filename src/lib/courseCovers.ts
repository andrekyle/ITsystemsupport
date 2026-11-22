import type { CourseData } from "../data/courses";
import { supabase } from "./supabase";
import { TENANT_ID } from "./tenant";

/** Generate only newly added items; completed covers remain in the draft on retry. */
export async function ensureCourseCovers(
  course: CourseData,
  original: CourseData | null,
  onUpdate: (course: CourseData) => void,
  onProgress: (message: string, completed?: number, total?: number) => void,
): Promise<CourseData> {
  const next = structuredClone(course);
  const moduleIds = new Set(original?.modules.map(module => module.id));
  const unitIds = new Set(original?.modules.flatMap(module => module.units.map(unit => unit.us)));
  const tasks: { title: string; label: string; kind: "module" | "unit"; description?: string; apply: (image: string) => void }[] = [];
  next.modules.forEach((module, index) => {
    if (!moduleIds.has(module.id) && !module.image) tasks.push({ kind: "module", title: module.name, label: `MODULE ${index + 1}`, description: module.description, apply: image => { module.image = image; } });
    module.units.forEach(unit => {
      if (!unitIds.has(unit.us) && !unit.image) tasks.push({ kind: "unit", title: unit.title, label: `UNIT STANDARD ${unit.us}`, description: unit.description, apply: image => { unit.image = image; unit.imageIncludesText = true; } });
    });
  });
  if (!tasks.length) return next;
  const client = supabase;
  const session = await client?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!client || !token) throw new Error("Sign in as an administrator to generate the new tile covers.");
  const bucket = client.storage.from("course-covers");
  const failures: string[] = [];
  let nextTask = 0;
  let completed = 0;
  let succeeded = 0;
  async function generateCovers() {
    while (true) {
      const task = tasks[nextTask++];
      if (!task) return;
      try {
        onProgress(`Generating cover for ${task.title}; ${completed} of ${tasks.length} complete. This can take up to 3 minutes.`, completed, tasks.length);
        const response = await fetch("/api/cover-image", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(210000), body: JSON.stringify({ kind: task.kind, title: task.title, label: task.label, description: task.description, courseTitle: course.meta.title }) });
        const raw = await response.text();
        let result: { error?: unknown; image?: unknown };
        try {
          result = JSON.parse(raw);
          if (!result || typeof result !== "object" || Array.isArray(result)) throw new Error();
        } catch {
          const contentType = response.headers.get("content-type")?.split(";")[0] || "unknown content type";
          const preview = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
          throw new Error(`/api/cover-image returned HTTP ${response.status} with ${contentType}, not JSON.${preview ? ` Server response: "${preview}".` : ""}`);
        }
        if (!response.ok || result.error) {
          const detail = typeof result.error === "string" && result.error.trim() ? result.error.trim() : `HTTP ${response.status}`;
          throw new Error(detail);
        }
        if (typeof result.image !== "string" || !result.image.startsWith("data:image/jpeg;base64,")) throw new Error("AI did not return a valid JPEG cover image.");
        const blob = await (await fetch(result.image)).blob();
        const path = `${TENANT_ID}/${encodeURIComponent(course.id)}/${crypto.randomUUID()}.jpg`;
        const { error } = await bucket.upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
        if (error) throw new Error(`The cover could not be stored: ${error.message}`);
        task.apply(bucket.getPublicUrl(path).data.publicUrl);
        succeeded++;
        onUpdate(structuredClone(next));
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        if (failures.length < 5) failures.push(`${task.label} — ${detail.slice(0, 400)}`);
      } finally {
        completed++;
        onProgress(`Processed ${completed} of ${tasks.length} covers.`, completed, tasks.length);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(2, tasks.length) }, () => generateCovers()));
  if (failures.length) {
    const remaining = completed - succeeded - failures.length;
    throw new Error(`Generated ${succeeded} of ${tasks.length} covers. Failed covers can be retried: ${failures.join("; ")}${remaining > 0 ? `; and ${remaining} more failure(s).` : ""}`);
  }
  onProgress("Saving...");
  return next;
}
