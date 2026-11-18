import { Icon } from "../icons";
import { useState } from "react";

/** Download the original banner, including locally uploaded data URLs. */
export function ImageDownload({ src, name }: { src: string; name: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mime = /^data:image\/([^;,]+)/i.exec(src)?.[1];
  const extension = mime ? (mime === "jpeg" ? "jpg" : mime === "svg+xml" ? "svg" : mime)
    : /\.(png|jpe?g|webp|gif|svg|avif)(?:[?#]|$)/i.exec(src)?.[1] ?? "png";
  const filename = `${name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 120) || "banner"}.${extension}`;
  return <a className="banner-image-download" href={src} download={filename}
    aria-label={busy ? `Downloading image for ${name}` : error ? `Retry download for ${name}` : `Download image for ${name}`} title={busy ? "Downloading..." : error || "Download original image"} aria-busy={busy}
    onClick={async event => {
      event.stopPropagation();
      if (!/^https?:/i.test(src) || new URL(src).origin === window.location.origin) return;
      event.preventDefault();
      if (busy) return;
      setBusy(true); setError("");
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error("The image could not be downloaded. Try again.");
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement("a");
        link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch { setError("Download failed. Click to retry."); }
      finally { setBusy(false); }
    }} onKeyDown={event => event.stopPropagation()}>
    <Icon name="download" size={16} />
  </a>;
}
