import { writeFile } from "fs/promises";
import { join } from "path";

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return new Response(JSON.stringify({ error: "No code provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Write to the course file
    const filePath = join(process.cwd(), "src/data/courses/it-systems-support.ts");
    await writeFile(filePath, code, "utf-8");

    return new Response(
      JSON.stringify({ success: true, message: "Calendar saved successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error saving calendar:", error);
    return new Response(
      JSON.stringify({ error: `Failed to save calendar: ${String(error)}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
