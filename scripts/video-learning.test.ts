import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { VideoWatchTracker, validVideoQuestions, videoQuizId } from "../src/lib/videoLearning";
import generateQuiz, { questionsUseSlideContext } from "../api/generate-slide-quiz";

test("slide quiz questions must be grounded in the supplied slide context", () => {
  const slide = "INTER-NETWORK. Internetworking connects individual LANs into WANs by using routers, bridges, and gateways.";
  const grounded = Array.from({ length: 5 }, (_, index) => ({
    q: `How does internetworking connect networks in example ${index + 1}?`,
    options: ["Using routers", "Educational methodologies", "Marketing strategies", "Project planning"],
    answer: 0,
    explain: "The slide states that routers connect networks.",
  }));
  const generic = grounded.map(question => ({
    ...question,
    q: "Which option best describes the primary focus of the slide?",
    options: ["Educational methodologies", "Technical specifications", "Project management", "Marketing strategies"],
    answer: 1,
    explain: "The slide focuses on technical specifications.",
  }));
  assert.equal(questionsUseSlideContext(slide, grounded, 5), true);
  assert.equal(questionsUseSlideContext(slide, generic, 5), false);
  const visual = grounded.map(question => ({ ...question, q: "Which device is shown in the image?", explain: "The image shows a router." }));
  assert.equal(questionsUseSlideContext("Hardware identification", visual, 5, true), true);
});

test("AI video quiz endpoint uses transcript-only facts and rejects incomplete or invalid answers", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "test-key";
  const questions = Array.from({ length: 5 }, (_, i) => ({
    q: `Question ${i}`, options: ["A", "B", "C", "D"], answer: 0, explain: "Transcript evidence.",
  }));
  let generated: unknown = questions;
  let requests = 0;
  globalThis.fetch = async (_, init) => {
    requests++;
    const body = JSON.parse(String(init?.body));
    assert.match(body.messages[0].content, /exactly 5.*video transcript/);
    assert.match(body.messages[0].content, /Do not invent facts/);
    return Response.json({ choices: [{ message: { content: JSON.stringify({ questions: generated }) } }] });
  };
  const request = (text: unknown = "Transcript with factual video content. ".repeat(20)) =>
    new Request("https://platform.example/api/generate-slide-quiz", { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slideText: text, purpose: "video", count: 10, model: "gpt-4.1-mini" }) });
  try {
    const valid = await generateQuiz(request());
    assert.equal(valid.status, 200);
    assert.equal((await valid.json()).questions.length, 5);
    for (const invalid of [questions.slice(0, 4), questions.map(q => ({ ...q, answer: 7 })), []]) {
      generated = invalid;
      assert.equal((await generateQuiz(request())).status, 502);
    }
    const before = requests;
    for (const text of ["short", {}, "x".repeat(50001)])
      assert.equal((await generateQuiz(request(text))).status, 400);
    assert.equal(requests, before, "Invalid transcripts do not incur AI requests");
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("full normal-speed viewing unlocks completion, not seeking, replaying or fast playback", () => {
  const full = new VideoWatchTracker();
  for (let i = 0; i <= 10; i++) full.sample(i, 10, i * 1000);
  assert.equal(full.finished, true);
  const seek = new VideoWatchTracker();
  seek.sample(0, 10, 0); seek.sample(9, 10, 100); seek.sample(10, 10, 1100);
  assert.equal(seek.finished, false);
  const repeated = new VideoWatchTracker();
  for (let loop = 0; loop < 3; loop++)
    for (let i = 0; i <= 5; i++) repeated.sample(i, 10, (loop * 6 + i) * 1000);
  assert.equal(repeated.finished, false);
  const fast = new VideoWatchTracker();
  for (let i = 0; i <= 10; i++) fast.sample(i, 10, i * 500);
  assert.equal(fast.finished, false);
});

test("pauses and reopening do not grant unwatched time; skipped sections can be recovered", () => {
  const tracker = new VideoWatchTracker();
  for (let i = 0; i <= 5; i++) tracker.sample(i, 10, i * 1000);
  tracker.pause();
  tracker.sample(5, 10, 20000);
  for (let i = 6; i <= 10; i++) tracker.sample(i, 10, (i + 15) * 1000);
  assert.equal(tracker.finished, true);
  assert.equal(tracker.watchedSeconds, 10);
  const skipped = new VideoWatchTracker();
  skipped.sample(0, 10, 0); skipped.sample(8, 10, 100);
  skipped.sample(9, 10, 1100); skipped.sample(10, 10, 2100);
  skipped.pause();
  for (let i = 0; i <= 8; i++) skipped.sample(i, 10, 3000 + i * 1000);
  assert.equal(skipped.finished, true);
  for (const duration of [0, Infinity, NaN]) {
    const invalid = new VideoWatchTracker();
    invalid.sample(10, duration, 10000);
    assert.equal(invalid.finished, false);
  }
});

test("YouTube end-frame duration rounding and polling jitter do not reject a full watch", () => {
  const tracker = new VideoWatchTracker();
  // Actual playable ending is 5:01; SDK metadata rounds up to 5:02.
  for (let i = 0; i <= 1204; i++) {
    const seconds = i / 4;
    const jitter = i % 2 === 0 ? 0 : 15;
    tracker.sample(seconds, 301.8, seconds * 1000 + jitter);
  }
  assert.equal(tracker.watchedSeconds, 301);
  assert.equal(tracker.finished, true);

  const delayedStart = new VideoWatchTracker();
  for (let i = 4; i <= 1204; i++)
    delayedStart.sample(i / 4, 301.8, i * 250);
  assert.equal(delayedStart.finished, true, "Small SDK startup delay plus rounded end is accepted");

  const skipped = new VideoWatchTracker();
  for (let i = 0; i <= 600; i++) skipped.sample(i / 4, 301.8, i * 250);
  skipped.pause();
  for (let i = 606; i <= 1204; i++) skipped.sample(i / 4, 301.8, i * 250);
  assert.equal(skipped.finished, false, "Skipping an interior section still blocks the quiz");

  const incomplete = new VideoWatchTracker();
  for (let i = 0; i <= 1190; i++) incomplete.sample(i / 4, 301.8, i * 250);
  assert.equal(incomplete.finished, false, "More than two seconds missing still blocks completion");
});

test("video assessments require exactly five distinct valid questions", () => {
  const questions = Array.from({ length: 5 }, (_, i) => ({
    q: `Question ${i}`, options: ["A", "B", "C", "D"], answer: i % 4, explain: "From the transcript.",
  }));
  assert(validVideoQuestions(questions));
  assert(!validVideoQuestions(questions.slice(0, 4)));
  assert(!validVideoQuestions([...questions, questions[0]]));
  assert(!validVideoQuestions(questions.map(q => ({ ...q, answer: 4 }))));
  assert(!validVideoQuestions(questions.map(q => ({ ...q, options: ["A", "A", "C", "D"] }))));
  assert.equal(videoQuizId("https://youtu.be/abcdefghijk"), videoQuizId("https://youtube.com/watch?v=abcdefghijk"));
});

test("view-count migration installs the missing RPC, isolates tenants and refreshes schema cache", async () => {
  const database = await videoViewDatabase();
  try {
    const migration = await readFile(new URL("../supabase/migrations/20261012_lesson_video_views.sql", import.meta.url), "utf8");
    assert(migration.includes("notify pgrst, 'reload schema'"));
    await database.exec(migration);
    await database.exec(migration);
    await database.exec("set role authenticated");
    await assert.rejects(database.query("select public.record_lesson_video_view('video')"), /Authentication/);
    await database.query("select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false)");
    await database.query("select set_config('request.jwt.tenant', 'tenant-one', false)");
    assert.equal((await database.query<{ count: number }>("select public.record_lesson_video_view('video') as count")).rows[0].count, 1);
    assert.equal((await database.query<{ count: number }>("select public.record_lesson_video_view('video') as count")).rows[0].count, 2);
    await database.query("select set_config('request.jwt.tenant', 'tenant-two', false)");
    assert.equal((await database.query<{ count: number }>("select public.record_lesson_video_view('video') as count")).rows[0].count, 1);
    await assert.rejects(database.query("select public.record_lesson_video_view('')"), /valid video/);
    await assert.rejects(database.query("select * from public.lesson_video_views"), /permission denied/);
    await database.exec("reset role");
    const dailyMigration = await readFile(new URL("../supabase/migrations/20261012_lesson_video_daily_views.sql", import.meta.url), "utf8");
    await database.exec(dailyMigration);
    assert.equal((await database.query("select * from public.lesson_video_views")).rows.length, 0,
      "Legacy click-based counts are reset");
    await database.exec("set role authenticated");
    const countView = async (video = "video") =>
      (await database.query<{ count: number }>("select public.record_lesson_video_view($1) as count", [video])).rows[0].count;
    assert.equal(await countView(), 1);
    assert.equal(await countView(), 1, "Repeat opens do not count within 24 hours");
    const accepted = await database.query("select public.record_lesson_video_view('other-video')");
    assert.equal(accepted.rows.length, 1, "Different videos count independently");
    await database.exec("reset role");
    const receipt = (await database.query<{ last_counted_at: Date }>(
      "select last_counted_at from public.lesson_video_view_receipts where video_id = 'video'")).rows[0].last_counted_at;
    await database.exec(dailyMigration);
    assert.equal((await database.query<{ count: number }>("select view_count as count from public.lesson_video_views where video_id = 'video'")).rows[0].count, 1,
      "Rerunning migration does not reset legitimate totals");
    assert.equal(String((await database.query<{ last_counted_at: Date }>(
      "select last_counted_at from public.lesson_video_view_receipts where video_id = 'video'")).rows[0].last_counted_at), String(receipt));
    await database.exec("set role authenticated");
    await database.query("select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false)");
    assert.equal(await countView(), 2, "Another user counts independently");
    assert.equal(await countView(), 2);
    await database.query("select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false)");
    await database.exec("reset role");
    await database.exec(`update public.lesson_video_view_receipts
      set last_counted_at = clock_timestamp() - interval '23 hours 59 minutes'
      where user_id = '11111111-1111-4111-8111-111111111111' and video_id = 'video'`);
    await database.exec("set role authenticated");
    assert.equal(await countView(), 2, "Less than 24 hours never adds a view");
    await database.exec("reset role");
    await database.exec(`update public.lesson_video_view_receipts
      set last_counted_at = clock_timestamp() - interval '24 hours'
      where user_id = '11111111-1111-4111-8111-111111111111' and video_id = 'video'`);
    await database.exec("set role authenticated");
    assert.equal(await countView(), 3, "Another view counts after the rolling 24-hour window");
    assert.equal(await countView(), 3, "New window also counts only once");
    await assert.rejects(database.query("select * from public.lesson_video_view_receipts"), /permission denied/);
    await database.query("select set_config('request.jwt.tenant', 'tenant-one', false)");
    assert.equal(await countView(), 1, "Daily counts are isolated between tenants");
    await database.exec("reset role; set role anon");
    await assert.rejects(database.query("select public.record_lesson_video_view('video')"), /permission denied/);
    await database.exec("reset role");
    // Deployments that already count daily keep their totals and receipts when the RPC is renamed.
    const beforeRename = await database.query<{ video_id: string; count: number }>(
      "select video_id, view_count as count from public.lesson_video_views order by video_id");
    await database.exec(await dailyViewRpcMigration());
    assert.deepEqual((await database.query<{ video_id: string; count: number }>(
      "select video_id, view_count as count from public.lesson_video_views order by video_id")).rows, beforeRename.rows,
      "Renaming the RPC keeps legitimate daily totals");
    await database.exec("set role authenticated");
    await database.query("select set_config('request.jwt.tenant', 'tenant-two', false)");
    await assert.rejects(database.query("select public.record_lesson_video_view('video')"), /does not exist/);
    assert.deepEqual(await dailyView(database), { views: 3, counted: false }, "Existing receipts still block a second daily view");
    await database.query("select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', false)");
    assert.deepEqual(await dailyView(database), { views: 4, counted: true }, "A new learner's first view counts");
    assert.deepEqual(await dailyView(database), { views: 4, counted: false });
  } finally { await database.close(); }
});

test("once-a-day RPC replaces the per-click counter on deployments that never applied the daily migration", async () => {
  const database = await videoViewDatabase();
  try {
    await database.exec(await readFile(new URL("../supabase/migrations/20261012_lesson_video_views.sql", import.meta.url), "utf8"));
    await database.exec("set role authenticated");
    await database.query("select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false)");
    await database.query("select set_config('request.jwt.tenant', 'tenant-one', false)");
    for (let click = 0; click < 5; click++) await database.query("select public.record_lesson_video_view('video')");
    await database.exec("reset role");
    const migration = await dailyViewRpcMigration();
    assert(migration.includes("notify pgrst, 'reload schema'"), "PostgREST learns about the renamed RPC");
    await database.exec(migration);
    assert.equal((await database.query("select * from public.lesson_video_views")).rows.length, 0,
      "Per-click totals are reset once");
    await database.exec("set role authenticated");
    await assert.rejects(database.query("select public.record_lesson_video_view('video')"), /does not exist/,
      "The per-click counter can no longer be called");
    assert.deepEqual(await dailyView(database), { views: 1, counted: true });
    for (let open = 0; open < 5; open++)
      assert.deepEqual(await dailyView(database), { views: 1, counted: false }, "Reopening the video the same day never adds a view");
    await database.query("select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false)");
    assert.deepEqual(await dailyView(database), { views: 2, counted: true }, "Each learner counts once");
    await database.query("select set_config('request.jwt.tenant', 'tenant-two', false)");
    assert.deepEqual(await dailyView(database), { views: 1, counted: true }, "Tenants keep separate totals");
    await database.query("select set_config('request.jwt.tenant', 'tenant-one', false)");
    await database.exec("reset role");
    await database.exec(migration);
    assert.equal((await database.query<{ count: number }>(
      "select view_count as count from public.lesson_video_views where tenant_id = 'tenant-one' and video_id = 'video'")).rows[0].count, 2,
      "Rerunning the migration keeps daily totals");
    // Days start at midnight South African time, not 24 hours after the last counted view.
    const sastMidnight = "date_trunc('day', clock_timestamp() at time zone 'Africa/Johannesburg') at time zone 'Africa/Johannesburg'";
    const backdateLearnerTwo = (lastCountedAt: string) => database.exec(`update public.lesson_video_view_receipts
      set last_counted_at = ${lastCountedAt}
      where user_id = '22222222-2222-4222-8222-222222222222' and video_id = 'video'`);
    await backdateLearnerTwo(sastMidnight);
    await database.exec("set role authenticated");
    assert.deepEqual(await dailyView(database), { views: 2, counted: false },
      "A view at the very start of today never counts again today, however many hours ago it was");
    await database.exec("reset role");
    await backdateLearnerTwo(`${sastMidnight} - interval '1 second'`);
    await database.exec("set role authenticated");
    assert.deepEqual(await dailyView(database), { views: 3, counted: true },
      "A view just before midnight counts again today, even though less than 24 hours passed");
    assert.deepEqual(await dailyView(database), { views: 3, counted: false }, "The new day also counts only once");
    await database.exec("reset role");
    await backdateLearnerTwo("clock_timestamp() - interval '24 hours'");
    await database.exec("set role authenticated");
    assert.deepEqual(await dailyView(database), { views: 4, counted: true }, "Yesterday's view never blocks today's");
    await assert.rejects(database.query("select public.record_lesson_video_daily_view('')"), /valid video/);
    await assert.rejects(database.query("select * from public.lesson_video_view_receipts"), /permission denied/);
    await assert.rejects(database.query("select * from public.lesson_video_views"), /permission denied/);
    await database.exec("reset role; set role anon");
    await assert.rejects(database.query("select public.record_lesson_video_daily_view('video')"), /permission denied/);
  } finally { await database.close(); }
});

async function videoViewDatabase() {
  const database = new PGlite();
  await database.exec(`
    create role authenticated; create role anon;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create function public.current_tenant() returns text language sql stable as $$
      select current_setting('request.jwt.tenant', true)
    $$;
    grant usage on schema public, auth to authenticated, anon;
  `);
  return database;
}

function dailyViewRpcMigration() {
  return readFile(new URL("../supabase/migrations/20261013_lesson_video_daily_view_rpc.sql", import.meta.url), "utf8");
}

/** Calls the once-a-day RPC the way the app does and returns its `{ views, counted }` result. */
async function dailyView(database: PGlite, video = "video") {
  const { result } = (await database.query<{ result: unknown }>(
    "select public.record_lesson_video_daily_view($1) as result", [video])).rows[0];
  const value = typeof result === "string" ? JSON.parse(result) as unknown : result;
  assert(value && typeof value === "object" && "views" in value && "counted" in value, `RPC returns views and counted: ${JSON.stringify(value)}`);
  return { views: Number((value as { views: unknown }).views), counted: (value as { counted: unknown }).counted };
}
