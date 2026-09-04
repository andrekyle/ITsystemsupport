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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), markAnswerDev(env)],
  };
});
