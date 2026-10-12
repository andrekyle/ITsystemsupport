import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { VideoWatchTracker, validVideoQuestions, videoQuizId } from "../src/lib/videoLearning";
import generateQuiz from "../api/generate-slide-quiz";

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
  const database = new PGlite();
  try {
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
    await database.exec("reset role; set role anon");
    await assert.rejects(database.query("select public.record_lesson_video_view('video')"), /permission denied/);
  } finally { await database.close(); }
});
