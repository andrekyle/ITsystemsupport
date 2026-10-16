import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { useLessonFigures } from "../src/store";
import { supabase } from "../src/lib/supabase";
import { TENANT_ID } from "../src/lib/tenant";
import { courseScopedUnit } from "../src/lib/courseScope";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

export async function testLessonFigures() {
  assert(supabase, "This regression needs the configured cloud client.");
  const unit = `figure-test-${crypto.randomUUID()}`;
  const key = `itss.lessonfigs.${courseScopedUnit(unit)}`;
  const from = supabase.storage.from;
  const uploads: string[] = [];
  const removed: string[] = [];
  let fail = false;
  supabase.storage.from = function (bucket) {
    assert(bucket === "files", "Lesson pictures must use the existing files bucket.");
    const api = from.call(this, bucket);
    api.upload = async path => {
      uploads.push(path);
      if (fail) throw new Error("new row violates row-level security policy");
      return { data: { id: "test", path, fullPath: `files/${path}` }, error: null };
    };
    api.remove = async paths => {
      removed.push(...paths);
      return { data: [], error: null };
    };
    api.createSignedUrl = async path => ({
      data: { signedUrl: `https://example.invalid/${path}` }, error: null,
    });
    return api;
  };
  let current: ReturnType<typeof useLessonFigures> | undefined;
  function Fixture() {
    current = useLessonFigures(unit);
    return null;
  }
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(<Fixture />));
    assert(current, "Figure hook mounted.");
    const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=";
    await current.setFigure("slide-image", image);
    const saved = JSON.parse(localStorage.getItem(key)!);
    assert(uploads[0].startsWith(`${TENANT_ID}/shared/lessonfigs/${unit}/`), "Uploads must satisfy the tenant-root storage policy.");
    assert(saved["slide-image"].path === uploads[0], "Persist the cloud path, not the base64 image.");
    fail = true;
    let message = "";
    try { await current.setFigure("slide-image", image); }
    catch (error) { message = error instanceof Error ? error.message : String(error); }
    assert(message.includes("row-level security"), "Show the storage failure instead of hiding it behind a false connection error.");
    assert(localStorage.getItem(key) === JSON.stringify(saved), "Failed replacements must retain the previous picture.");
    assert(removed.length === 0, "Failed uploads must not delete the saved picture.");
    fail = false;
    await current.setFigure("slide-image", image);
    assert(removed.includes(uploads[0]), "Successful replacement cleans up the previously saved picture.");
    assert(uploads[0] !== uploads[2], "Each replacement uses a unique storage object.");
    return "Passed tenant-scoped image upload, saved path, actionable errors and safe replacement.";
  } finally {
    flushSync(() => root.unmount());
    host.remove();
    localStorage.removeItem(key);
    supabase.storage.from = from;
  }
}
