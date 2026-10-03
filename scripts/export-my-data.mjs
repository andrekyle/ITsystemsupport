// One-off Supabase data export: signs in with a cloud account and downloads
// everything that account can read (per-user + shared tables + storage files)
// into a timestamped folder under ./supabase-export/.
//
// Usage:
//   node scripts/export-my-data.mjs <email> <password>
//
// Credentials are read from argv (never written to disk). Supabase URL + anon
// key are read from .env.local / .env.
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

async function loadEnvAsync() {
  const out = {};
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    const text = await readFile(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in out)) out[key] = val;
    }
  }
  return out;
}

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error("Usage: node scripts/export-my-data.mjs <email> <password>");
  process.exit(1);
}

const env = await loadEnvAsync();
const URL = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY;
if (!URL || !ANON) {
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outDir = path.join("supabase-export", stamp);
await mkdir(outDir, { recursive: true });

const supabase = createClient(URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(`Signing in as ${email} ...`);
const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
if (authErr) {
  console.error("Sign-in failed:", authErr.message);
  process.exit(1);
}
const uid = auth.user.id;
console.log(`Signed in. auth uid = ${uid}`);

const manifest = {
  exportedAt: new Date().toISOString(),
  account: { email: auth.user.email, uid },
  tables: {},
  storage: {},
};

async function saveJson(name, value) {
  await writeFile(path.join(outDir, name), JSON.stringify(value, null, 2), "utf8");
}

// Fetch every row of a query in pages of 1000 to beat the default row cap.
async function fetchAll(label, build) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];
  for (;;) {
    const { data, error } = await build().range(from, from + pageSize - 1);
    if (error) {
      console.warn(`  ! ${label}: ${error.message}`);
      return { rows, error: error.message };
    }
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return { rows };
}

// ---- per-user and shared key/value state ----
console.log("Exporting app_state (your rows) ...");
{
  const { rows, error } = await fetchAll("app_state", () =>
    supabase.from("app_state").select("user_id,key,value,updated_at").eq("user_id", uid)
  );
  await saveJson("app_state.json", rows);
  manifest.tables.app_state = { count: rows.length, error };
  console.log(`  app_state: ${rows.length} rows`);
}

console.log("Exporting shared_state ...");
{
  const { rows, error } = await fetchAll("shared_state", () =>
    supabase.from("shared_state").select("key,value,updated_at")
  );
  await saveJson("shared_state.json", rows);
  manifest.tables.shared_state = { count: rows.length, error };
  console.log(`  shared_state: ${rows.length} rows`);
}

// ---- chat (sent + received) ----
console.log("Exporting chat_messages ...");
{
  const { rows, error } = await fetchAll("chat_messages", () =>
    supabase
      .from("chat_messages")
      .select("*")
      .or(`sender_user_id.eq.${uid},recipient_user_id.eq.${uid}`)
  );
  await saveJson("chat_messages.json", rows);
  manifest.tables.chat_messages = { count: rows.length, error };
  console.log(`  chat_messages: ${rows.length} rows`);
}

// ---- token usage ----
console.log("Exporting token_usage ...");
{
  const { rows, error } = await fetchAll("token_usage", () =>
    supabase.from("token_usage").select("*").eq("user_id", uid)
  );
  await saveJson("token_usage.json", rows);
  manifest.tables.token_usage = { count: rows.length, error };
  console.log(`  token_usage: ${rows.length} rows`);
}

// ---- forms + responses ----
console.log("Exporting forms ...");
{
  const { rows, error } = await fetchAll("forms", () => supabase.from("forms").select("*"));
  await saveJson("forms.json", rows);
  manifest.tables.forms = { count: rows.length, error };
  console.log(`  forms: ${rows.length} rows`);
}

console.log("Exporting form_responses (yours) ...");
{
  const { rows, error } = await fetchAll("form_responses", () =>
    supabase.from("form_responses").select("*").eq("user_id", uid)
  );
  await saveJson("form_responses.json", rows);
  manifest.tables.form_responses = { count: rows.length, error };
  console.log(`  form_responses: ${rows.length} rows`);
}

// ---- storage: files bucket (your folder + shared) ----
console.log("Exporting storage files ...");
async function listFolder(prefix) {
  const all = [];
  let offset = 0;
  const limit = 100;
  for (;;) {
    const { data, error } = await supabase.storage
      .from("files")
      .list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } });
    if (error) {
      console.warn(`  ! list ${prefix}: ${error.message}`);
      break;
    }
    if (!data || data.length === 0) break;
    for (const entry of data) {
      const full = prefix ? `${prefix}/${entry.name}` : entry.name;
      // Folders have a null id in the Supabase storage list response.
      if (entry.id === null) {
        all.push(...(await listFolder(full)));
      } else {
        all.push(full);
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return all;
}

const fileManifest = [];
for (const root of [uid, "shared"]) {
  const paths = await listFolder(root);
  for (const p of paths) {
    const { data, error } = await supabase.storage.from("files").download(p);
    if (error || !data) {
      console.warn(`  ! download ${p}: ${error?.message ?? "no data"}`);
      fileManifest.push({ path: p, ok: false, error: error?.message ?? "no data" });
      continue;
    }
    const buf = Buffer.from(await data.arrayBuffer());
    const dest = path.join(outDir, "files", p);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    fileManifest.push({ path: p, ok: true, bytes: buf.length });
    console.log(`  saved files/${p} (${buf.length} bytes)`);
  }
}
manifest.storage.files = {
  total: fileManifest.length,
  downloaded: fileManifest.filter((f) => f.ok).length,
  entries: fileManifest,
};

await saveJson("manifest.json", manifest);
await supabase.auth.signOut();

console.log(`\nDone. Export written to: ${path.resolve(outDir)}`);
console.log(`Tables: ${Object.entries(manifest.tables).map(([k, v]) => `${k}=${v.count}`).join(", ")}`);
console.log(`Files: ${manifest.storage.files.downloaded}/${manifest.storage.files.total} downloaded`);
