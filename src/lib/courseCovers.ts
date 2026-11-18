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
  for (const [index, task] of tasks.entries()) {
    onProgress(`Generating cover ${index + 1} of ${tasks.length}: ${task.title}`, index, tasks.length);
    const response = await fetch("/api/cover-image", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(210000), body: JSON.stringify({ kind: task.kind, title: task.title, label: task.label, description: task.description, courseTitle: course.meta.title }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Could not generate the cover for ${task.title}.`);
    if (typeof result.image !== "string" || !result.image.startsWith("data:image/jpeg;base64,")) throw new Error("AI returned an invalid cover image.");
    // Store a stable public URL instead of putting large images in shared localStorage.
    const blob = await (await fetch(result.image)).blob();
    const path = `${TENANT_ID}/${encodeURIComponent(course.id)}/${crypto.randomUUID()}.jpg`;
    const { error } = await client.storage.from("course-covers").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
    if (error) throw new Error("The cover could not be stored. Apply the course-covers storage migration and retry saving.");
    task.apply(client.storage.from("course-covers").getPublicUrl(path).data.publicUrl);
    onUpdate(structuredClone(next));
    onProgress(`Completed cover ${index + 1} of ${tasks.length}`, index + 1, tasks.length);
  }
  onProgress("Saving...");
  return next;
}
