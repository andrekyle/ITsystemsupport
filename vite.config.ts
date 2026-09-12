import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";

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
      server.middlewares.use("/api/generate-form", (request, response) => {
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
          const module = await server.ssrLoadModule("/api/generate-form.ts") as { default: (request: Request) => Promise<Response> };
          const result = await module.default(new Request("http://localhost/api/generate-form", {
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), markAnswerDev(env), formBuilderDev(env)],
  };
});
