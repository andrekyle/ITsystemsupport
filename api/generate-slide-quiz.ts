import { CONTENT_MODELS, selectAiModel } from "../src/lib/aiModels";

export const config = { runtime: "edge" };
declare const process: { env?: Record<string, string | undefined> } | undefined;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let key = "";
  let configuredModel = "gpt-4.1-mini";
  try {
    key = process?.env?.OPENAI_API_KEY ?? "";
    configuredModel = process?.env?.OPENAI_UNIT_MODEL || configuredModel;
  } catch { /* edge */ }
  if (!key) return Response.json({ error: "OpenAI is not configured." }, { status: 503 });

  let body: { slideText?: string; count?: number; model?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "The quiz request is invalid." }, { status: 400 });
  }
  const model = selectAiModel(body.model, CONTENT_MODELS, configuredModel);
  if (!model) return Response.json({ error: body.model === undefined ? "The configured content model is not available in the model selector." : "Choose a supported AI content model." }, { status: body.model === undefined ? 503 : 400 });
  const count = Math.min(10, Math.max(3, Math.round(Number(body.count) || 5)));
  const text = (body.slideText ?? "").trim().slice(0, 50000);
  if (!text) return Response.json({ error: "This slide has no text to use." }, { status: 400 });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `Create exactly ${count} useful multiple-choice quiz questions from the supplied slide. Return JSON only: {"questions":[{"q":string,"options":string[4],"answer":number,"explain":string}]}. answer is the zero-based correct option index. Do not invent facts outside the slide.` },
        { role: "user", content: text },
      ],
    }),
  });
  if (!response.ok) return Response.json({ error: `OpenAI request failed (${response.status}).` }, { status: 502 });
  const data = await response.json() as { choices?: { message?: { content?: string } }[]; usage?: unknown; model?: string };
  try {
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    const questions = Array.isArray(parsed.questions) ? parsed.questions.filter((q: any) => typeof q.q === "string" && Array.isArray(q.options) && q.options.length === 4 && Number.isInteger(q.answer)).slice(0, count) : [];
    return Response.json({ questions, usage: data.usage, model: data.model });
  } catch {
    return Response.json({ error: "OpenAI returned invalid quiz data." }, { status: 502 });
  }
}
