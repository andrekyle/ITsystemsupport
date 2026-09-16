import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { promises as fs } from "node:fs";
import path from "node:path";

/** Serve the Vercel function api/mark-answer.ts in local dev, so the LLM
 *  semantic marking behaves the same on localhost as in production.
 *  Needs OPENAI_API_KEY in .env.local; without it the endpoint reports
 *  not_configured and the deterministic marker stands alone. */
function markAnswerDev(env: Record<string, string>): Plugin {
  return {
    name: "mark-answer-dev",
    configureServer(server: ViteDevServer) {
      if (env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
        process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;
      }
      server.middlewares.use("/api/generate-slide-quiz", (req, res) => {
        void (async () => {
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const mod = await server.ssrLoadModule("/api/generate-slide-quiz.ts") as { default: (r: Request) => Promise<Response> };
          const response = await mod.default(new Request("http://localhost/api/generate-slide-quiz", { method: req.method ?? "POST", headers: { "content-type": "application/json" }, body: Buffer.concat(chunks).toString("utf8") }));
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(await response.text());
        })().catch(() => { res.statusCode = 500; res.end(JSON.stringify({ error: "Quiz generation failed." })); });
      });
      server.middlewares.use("/api/mark-answer", (req, res) => {
        void (async () => {
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const mod = (await server.ssrLoadModule("/api/mark-answer.ts")) as {
            default: (r: Request) => Promise<Response>;
          };
          const request = new Request("http://localhost/api/mark-answer", {
            method: req.method ?? "POST",
            headers: { "content-type": "application/json" },
            body: chunks.length ? Buffer.concat(chunks).toString("utf8") : undefined,
          });
          const response = await mod.default(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(await response.text());
        })().catch((e) => {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ credited: [], reason: "", error: `dev_middleware: ${String(e)}` }));
        });
      });
    },
  };
}

function formBuilderDev(env: Record<string, string>): Plugin {
  return {
    name: "form-builder-dev",
    configureServer(server: ViteDevServer) {
      for (const key of ["OPENAI_API_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY", "VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"]) {
        if (env[key] && process.env[key] === undefined) process.env[key] = env[key];
      }
      for (const endpoint of ["generate-form", "enhance-unit-quiz"]) server.middlewares.use(`/api/${endpoint}`, (request, response) => {
        void (async () => {
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of request) {
            const buffer = Buffer.from(chunk);
            size += buffer.length;
            if (size > 3_500_000) {
              response.statusCode = 413;
              response.setHeader("Content-Type", "application/json");
              response.end(JSON.stringify({ error: "Document content exceeds the generation limit." }));
              return;
            }
            chunks.push(buffer);
          }
          const module = await server.ssrLoadModule(`/api/${endpoint}.ts`) as { default: (request: Request) => Promise<Response> };
          const result = await module.default(new Request(`http://localhost/api/${endpoint}`, {
            method: request.method ?? "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: request.headers.authorization ?? "",
              "Content-Length": String(size),
            },
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          }));
          response.statusCode = result.status;
          result.headers.forEach((value, key) => response.setHeader(key, value));
          response.end(await result.text());
        })().catch(() => {
          response.statusCode = 500;
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({ error: "Local form generation is unavailable." }));
        });
      });
    },
  };
}

type CalendarUnit = { us: string; title: string; nqf: number; credits: number; dates: string; time: string };
type CalendarModule = { id: string; name: string; icon: string; image?: string; activities: number; units: CalendarUnit[] };
type CalendarMilestone = { name: string; dates: string; time: string; icon: string };

/** Dev-only endpoint behind the Training Calendar page's edit mode. Persists
 *  the edited calendar straight into the course data file by regenerating only
 *  the `const modules` and `const programmeMilestones` blocks — the rest of
 *  the file is left untouched. Never deployed (dev middleware only). */
function saveCalendarDev(): Plugin {
  const clean = (v: unknown) =>
    String(v ?? "").replace(/[\r\n]+/g, " ").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  const renderModules = (mods: CalendarModule[]) =>
    mods
      .map((m) => {
        const lines = [
          "  {",
          `    id: "${clean(m.id)}",`,
          `    name: "${clean(m.name)}",`,
          `    icon: "${clean(m.icon)}",`,
        ];
        if (m.image) lines.push(`    image: "${clean(m.image)}",`);
        lines.push(`    activities: ${num(m.activities)},`, "    units: [");
        for (const u of m.units)
          lines.push(
            `      { us: "${clean(u.us)}", title: "${clean(u.title)}", nqf: ${num(u.nqf)}, credits: ${num(u.credits)}, dates: "${clean(u.dates)}", time: "${clean(u.time)}" },`
          );
        lines.push("    ],", "  },");
        return lines.join("\n");
      })
      .join("\n");

  const renderMilestones = (ms: CalendarMilestone[]) =>
    ms
      .map((x) => `  { name: "${clean(x.name)}", dates: "${clean(x.dates)}", time: "${clean(x.time)}", icon: "${clean(x.icon)}" },`)
      .join("\n");

  const replaceBlock = (source: string, header: string, inner: string) => {
    const start = source.indexOf(header);
    if (start < 0) throw new Error(`could not find "${header}" in the course file`);
    const bodyStart = start + header.length;
    const nl = source.indexOf("\n];", bodyStart);
    if (nl < 0) throw new Error(`could not find the end of the "${header}" block`);
    // preserve the file's existing line endings (CRLF on Windows checkouts)
    const eol = source.includes("\r\n") ? "\r\n" : "\n";
    const end = source[nl - 1] === "\r" ? nl - 1 : nl;
    return source.slice(0, bodyStart) + eol + inner.split("\n").join(eol) + source.slice(end);
  };

  const FILE_BY_COURSE: Record<string, string> = {
    itss: "src/data/courses/it-systems-support.ts",
    genman: "src/data/courses/generic-management.ts",
  };

  return {
    name: "save-calendar-dev",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/save-calendar", (request, response) => {
        void (async () => {
          response.setHeader("Content-Type", "application/json");
          if ((request.method ?? "GET") !== "POST") {
            response.statusCode = 405;
            response.end(JSON.stringify({ error: "Method not allowed" }));
            return;
          }
          const chunks: Buffer[] = [];
          for await (const chunk of request) chunks.push(Buffer.from(chunk));
          const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
            courseId?: string;
            modules?: CalendarModule[];
            milestones?: CalendarMilestone[];
          };
          const file = FILE_BY_COURSE[body.courseId ?? ""];
          if (!file || !Array.isArray(body.modules) || !Array.isArray(body.milestones)) {
            response.statusCode = 400;
            response.end(JSON.stringify({ error: "Invalid calendar payload" }));
            return;
          }
          const filePath = path.resolve(server.config.root, file);
          let source = await fs.readFile(filePath, "utf8");
          source = replaceBlock(source, "const modules: CourseModule[] = [", renderModules(body.modules));
          source = replaceBlock(source, "const programmeMilestones = [", renderMilestones(body.milestones));
          await fs.writeFile(filePath, source, "utf8");
          response.statusCode = 200;
          response.end(JSON.stringify({ ok: true }));
        })().catch((error) => {
          response.statusCode = 500;
          response.end(
            JSON.stringify({ error: `Failed to save calendar: ${error instanceof Error ? error.message : String(error)}` })
          );
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), markAnswerDev(env), formBuilderDev(env), saveCalendarDev()],
  };
});
