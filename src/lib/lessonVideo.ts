export type LessonVideoSource = { kind: "embed" | "file"; src: string };

export function lessonVideoSource(link: string): LessonVideoSource {
  let url: URL;
  try { url = new URL(link.trim()); }
  catch { throw new Error("Enter a complete HTTPS video link."); }
  if (url.protocol !== "https:") throw new Error("Video links must use HTTPS.");
  if (url.username || url.password) throw new Error("Video links must not contain credentials.");
  const host = url.hostname.toLowerCase();
  if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be"].includes(host)) {
    const id = host === "youtu.be" ? url.pathname.split("/")[1]
      : url.pathname === "/watch" ? url.searchParams.get("v")
      : /^\/(?:embed|shorts|live)\//.test(url.pathname) ? url.pathname.split("/")[2] : null;
    if (!id || !/^[\w-]{11}$/.test(id)) throw new Error("Enter a link to a specific YouTube video.");
    return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(host)) {
    const match = url.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?\/?$/);
    if (!match) throw new Error("Enter a link to a specific Vimeo video.");
    const hash = url.searchParams.get("h") ?? match[2];
    if (hash && !/^[a-zA-Z0-9]+$/.test(hash)) throw new Error("The Vimeo privacy link is invalid.");
    return { kind: "embed", src: `https://player.vimeo.com/video/${match[1]}${hash ? `?h=${hash}` : ""}` };
  }
  if (/\.(mp4|webm|ogv)$/i.test(url.pathname)) return { kind: "file", src: url.href };
  throw new Error("Use a YouTube or Vimeo video link, or a direct MP4, WebM or OGV link.");
}
