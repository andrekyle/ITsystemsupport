export const config = { runtime: "edge" };
declare const process: { env?: Record<string, string | undefined> };
const json = (value: unknown, status = 200) => Response.json(value, { status });

function outputText(data: any): string {
  if (typeof data.output_text === "string") return data.output_text;
  const pieces: string[] = [];
  for (const item of data.output ?? []) for (const part of item.content ?? []) if (typeof part.text === "string") pieces.push(part.text);
  return pieces.join("\n");
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  const env = process.env ?? {};
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const anon = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!env.OPENAI_API_KEY || !url || !anon) return json({ error: "Logbook image reading requires server OpenAI and Supabase configuration." }, 503);
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/.test(authorization)) return json({ error: "Sign in as an administrator to read logbook images." }, 401);
  if (Number(request.headers.get("content-length") ?? 0) > 28_000_000) return json({ error: "Upload fewer or smaller images." }, 413);
  try {
    const headers = { Authorization: authorization, apikey: anon, "Content-Type": "application/json" };
    const admin = await fetch(`${url}/rest/v1/rpc/is_admin`, { method: "POST", headers, body: "{}", signal: AbortSignal.timeout(4_000) });
    if (!admin.ok || await admin.json() !== true) return json({ error: "Administrator access is required." }, 403);
    const body = await request.json();
    const images = Array.isArray(body.images) ? body.images : [];
    if (!images.length || images.length > 8 || images.some(image => typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(image))) {
      return json({ error: "Upload 1-8 clear PNG, JPEG or WebP logbook images." }, 400);
    }
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(70_000), body: JSON.stringify({
      model: env.OPENAI_UNIT_MODEL || "gpt-4.1-mini",
      input: [{ role: "user", content: [
        { type: "input_text", text: `Read these logbook form images exactly enough to populate an LMS logbook. Return plain text only, no markdown fences. Preserve these sections when visible: Embedded Knowledge Questions, Practical Activities, Workplace Activities, Other Activities, Feedback Record, Declaration, Project Checklist. For each checklist row include the row number, full row text, and six evidence columns as true/false in this order: Workplace Learner Activity, Workplace Logbook Activity, Workplace Project, Assessor Learner Manual, Assessor Logbook Activity, Assessor Project. Preserve project title, evidence notes, unit standard number and title if visible.` },
        ...images.map((image: string) => ({ type: "image_url", image_url: { url: image, detail: "high" } }))
      ] }]
    }) });
    if (!response.ok) return json({ error: "OpenAI could not read the logbook image. Try a clearer image or fewer pages." }, 502);
    const text = outputText(await response.json()).trim();
    if (!text) return json({ error: "No readable logbook text was found in the image." }, 422);
    return json({ text });
  } catch {
    return json({ error: "The logbook image could not be read. Try a clearer image or paste the content manually." }, 502);
  }
}
