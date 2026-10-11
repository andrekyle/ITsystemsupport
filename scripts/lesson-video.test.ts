import assert from "node:assert/strict";
import { test } from "node:test";
import { lessonVideoSource } from "../src/lib/lessonVideo";

test("YouTube links use the privacy-enhanced embedded player", () => {
  for (const link of ["https://youtu.be/abcdefghijk", "https://www.youtube.com/watch?v=abcdefghijk", "https://youtube.com/shorts/abcdefghijk", "https://www.youtube-nocookie.com/embed/abcdefghijk"]) {
    assert.deepEqual(lessonVideoSource(link), { kind: "embed", src: "https://www.youtube-nocookie.com/embed/abcdefghijk" });
  }
});
test("Vimeo privacy links and direct video files are retained", () => {
  assert.equal(lessonVideoSource("https://vimeo.com/123456/abc123").src, "https://player.vimeo.com/video/123456?h=abc123");
  assert.equal(lessonVideoSource("https://player.vimeo.com/video/123456?h=abc123").src, "https://player.vimeo.com/video/123456?h=abc123");
  assert.deepEqual(lessonVideoSource("https://example.com/lesson.mp4?token=test"), { kind: "file", src: "https://example.com/lesson.mp4?token=test" });
});
test("invalid, unsafe and unsupported embedding links are rejected", () => {
  for (const link of ["bad", "javascript:alert(1)", "http://youtu.be/abcdefghijk", "https://youtube.com.evil.com/watch?v=abcdefghijk", "https://youtube.com/watch?v=bad", "https://user:password@example.com/a.mp4", "https://example.com/page"]) {
    assert.throws(() => lessonVideoSource(link));
  }
});
