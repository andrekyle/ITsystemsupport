import fs from "node:fs";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
try {
  await db.exec("create table public.shared_state(tenant_id text,key text,value text,updated_at timestamptz default now());");
  const version = (revision, count) => ({ revision, content: { lesson: Array.from({ length: count }, (_, i) => ({ heading: `Slide ${i + 1}` })) } });
  const pack = { ...version("current", 23), history: [version("complete", 33)] };
  const insert = (key, value) => db.query("insert into shared_state(tenant_id,key,value) values('investec',$1,$2)", [key, JSON.stringify(value)]);
  await insert("itss.unitbuilder.114074.shared", pack);
  await insert("itss.lessonedits.114074.built-current", { deletedSections: [1, 3, 99] });
  await insert("itss.lessonedits.114074.built-complete", { deletedSections: [] });
  await insert("itss.unitbuilder.114074.deleted-backup", version("backup", 34));
  const snapshot = async () => (await db.query("select * from shared_state order by key")).rows;
  const before = await snapshot();
  const results = await db.exec(fs.readFileSync("supabase/recovery/audit-course-content.sql", "utf8"));
  const rows = results.at(-1).rows;
  const current = rows.find(row => row.source === "current published unit");
  assert.equal(current.stored_slides, 23);
  assert.equal(Number(current.hidden_slides), 2);
  assert.equal(Number(current.visible_slides), 21);
  assert.equal(rows.find(row => row.revision === "complete").stored_slides, 33);
  assert.equal(rows.find(row => row.revision === "backup").stored_slides, 34);
  assert.deepEqual(await snapshot(), before);
  console.log("PASS: read-only course audit distinguishes hidden slides from missing slides and finds complete archived and deleted-build versions");
} finally { await db.close(); }
