import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { parseFormDefinition, type FormAnswers, type FormDefinition } from "./formSchema";

export interface SavedForm {
  id: string;
  title: string;
  description: string;
  definition: FormDefinition;
  created_by: string;
  created_at: string;
  updated_at: string;
  source_name: string;
  source_type: string;
  source_size: number;
  source_path: string | null;
}

export interface FormResponse {
  form_id: string;
  user_id: string;
  profile_id: string;
  answers: FormAnswers;
  updated_at: string;
}

const LOCAL_FORMS_KEY = "form-builder:templates";
const FORMS_EVENT = "form-builder-changed";
const SOURCE_BUCKET = "form-sources";
const FORM_COLUMNS = "id,title,description,definition,created_by,created_at,updated_at,source_name,source_type,source_size,source_path";

function readLocal<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { throw new Error("Saved form data could not be read."); }
}

function databaseError(error: { message: string; code?: string }): Error {
  if (error.code === "42P01" || error.code === "PGRST205") {
    return new Error("The forms database is not set up. Apply the form-builder SQL migration in Supabase, then retry.");
  }
  if (error.code === "42501") return new Error("You do not have permission to save this form. Sign in with the administrator account.");
  return new Error(error.message || "The form could not be saved.");
}

export async function listForms(): Promise<SavedForm[]> {
  if (!supabase) return readLocal<SavedForm[]>(LOCAL_FORMS_KEY, []);
  const { data, error } = await supabase.from("forms").select(FORM_COLUMNS).order("created_at", { ascending: false });
  if (error) throw databaseError(error);
  return (data ?? []).map(row => ({ ...row, definition: parseFormDefinition(row.definition) })) as SavedForm[];
}

export async function saveFormTemplate(definition: FormDefinition, source: File | null, profileId: string): Promise<SavedForm> {
  const parsed = parseFormDefinition(definition);
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  let createdBy = profileId;
  let sourcePath: string | null = null;
  if (supabase) {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Sign in before saving a form.");
    createdBy = data.user.id;
    if (source) {
      sourcePath = `${createdBy}/${id}/${source.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100)}`;
      const { error } = await supabase.storage.from(SOURCE_BUCKET).upload(sourcePath, source, { contentType: source.type || "application/octet-stream", upsert: false });
      if (error) throw new Error("The original form could not be stored. Check the form-sources bucket and the form-builder migration.");
    }
  }
  const template: SavedForm = {
    id, title: parsed.title, description: parsed.description, definition: parsed,
    created_by: createdBy, created_at: timestamp, updated_at: timestamp,
    source_name: source?.name ?? "", source_type: source?.type ?? "", source_size: source?.size ?? 0, source_path: sourcePath,
  };
  if (supabase) {
    const { data, error } = await supabase.from("forms").insert(template).select(FORM_COLUMNS).single();
    if (error || !data) {
      if (sourcePath) await supabase.storage.from(SOURCE_BUCKET).remove([sourcePath]);
      throw databaseError(error ?? { message: "The form was not saved." });
    }
    window.dispatchEvent(new Event(FORMS_EVENT));
    return { ...data, definition: parseFormDefinition(data.definition) } as SavedForm;
  }
  const forms = readLocal<SavedForm[]>(LOCAL_FORMS_KEY, []);
  localStorage.setItem(LOCAL_FORMS_KEY, JSON.stringify([template, ...forms]));
  window.dispatchEvent(new Event(FORMS_EVENT));
  return template;
}

export async function removeFormTemplate(template: SavedForm): Promise<void> {
  if (supabase) {
    const { data, error } = await supabase.from("forms").delete().eq("id", template.id).select("id");
    if (error) throw databaseError(error);
    if (!data?.length) throw new Error("The form could not be deleted. Check your permissions.");
    if (template.source_path) await supabase.storage.from(SOURCE_BUCKET).remove([template.source_path]);
  } else {
    localStorage.setItem(LOCAL_FORMS_KEY, JSON.stringify(readLocal<SavedForm[]>(LOCAL_FORMS_KEY, []).filter(form => form.id !== template.id)));
    for (const key of Object.keys(localStorage)) if (key.startsWith(`form-builder:response:${template.id}:`)) localStorage.removeItem(key);
  }
  window.dispatchEvent(new Event(FORMS_EVENT));
}

export async function loadFormResponse(formId: string, profileId: string): Promise<FormResponse | null> {
  if (!supabase) return readLocal<FormResponse | null>(`form-builder:response:${formId}:${profileId}`, null);
  const { data: session, error: authError } = await supabase.auth.getUser();
  if (authError || !session.user) throw new Error("Sign in to load your saved answers.");
  const { data, error } = await supabase.from("form_responses").select("form_id,user_id,profile_id,answers,updated_at").eq("form_id", formId).eq("user_id", session.user.id).eq("profile_id", profileId).maybeSingle();
  if (error) throw databaseError(error);
  return data as FormResponse | null;
}

export async function saveFormResponse(formId: string, profileId: string, answers: FormAnswers): Promise<FormResponse> {
  const updatedAt = new Date().toISOString();
  let userId = profileId;
  if (supabase) {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Sign in to save your answers.");
    userId = data.user.id;
  }
  const response: FormResponse = { form_id: formId, user_id: userId, profile_id: profileId, answers, updated_at: updatedAt };
  if (supabase) {
    const { data, error } = await supabase.from("form_responses").upsert(response, { onConflict: "form_id,user_id,profile_id" }).select("form_id,user_id,profile_id,answers,updated_at").single();
    if (error || !data) throw databaseError(error ?? { message: "Your answers were not saved." });
    return data as FormResponse;
  }
  localStorage.setItem(`form-builder:response:${formId}:${profileId}`, JSON.stringify(response));
  return response;
}

export async function formSourceUrl(template: SavedForm): Promise<string | null> {
  if (!supabase || !template.source_path) return null;
  const { data, error } = await supabase.storage.from(SOURCE_BUCKET).createSignedUrl(template.source_path, 300, { download: template.source_name });
  if (error) throw new Error("The original document could not be downloaded.");
  return data.signedUrl;
}

export function useForms() {
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const reload = () => setRevision(value => value + 1);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void listForms().then(result => { if (active) setForms(result); }).catch(error => { if (active) setError(error instanceof Error ? error.message : "Forms could not be loaded."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  useEffect(() => {
    const changed = () => setRevision(value => value + 1);
    const storage = (event: StorageEvent) => { if (event.key === LOCAL_FORMS_KEY) changed(); };
    window.addEventListener(FORMS_EVENT, changed);
    window.addEventListener("storage", storage);
    window.addEventListener("focus", changed);
    return () => {
      window.removeEventListener(FORMS_EVENT, changed);
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", changed);
    };
  }, []);
  return { forms, loading, error, reload };
}