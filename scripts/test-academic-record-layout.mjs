import { spawnSync } from "node:child_process";
import { resolve, join } from "node:path";
import { runBrowserTest } from "./browser-test-runner.mjs";

const dir = resolve("supabase-export/academic-layout-check");
const fixture = spawnSync(process.execPath, ["scripts/test-lesson-evidence-loading.cjs"], {
  env: { ...process.env, ACADEMIC_VIEW_FIXTURE: join(dir, "index.html") }, encoding: "utf8", windowsHide: true,
});
if (fixture.status !== 0) throw new Error(fixture.stderr || fixture.stdout);
for (const width of [390, 850, 1530]) {
  await runBrowserTest(dir, { width, height: 1000 });
  if (process.exitCode) break;
}
