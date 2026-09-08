import type { ReactNode } from "react";

/** Premium emoji rendering — self-hosted Twemoji SVGs (© Twitter/X contributors,
 *  CC-BY 4.0) for the curated chat set. Unmapped emojis fall back to the native font. */
const CODE: Record<string, string> = {
  "😀": "1f600",
  "😂": "1f602",
  "😊": "1f60a",
  "😎": "1f60e",
  "🤔": "1f914",
  "😢": "1f622",
  "🥳": "1f973",
  "👍": "1f44d",
  "🙏": "1f64f",
  "👏": "1f44f",
  "💪": "1f4aa",
  "🤝": "1f91d",
  "👋": "1f44b",
  "⭐": "2b50",
  "🎉": "1f389",
  "✅": "2705",
  "❌": "274c",
  "☕": "2615",
  "📚": "1f4da",
  "💻": "1f4bb",
  "🎓": "1f393",
};

export function Em({ ch, size = 20 }: { ch: string; size?: number }) {
  const code = CODE[ch];
  if (!code) return <>{ch}</>;
  return (
    <img
      className="twemoji"
      src={`/emoji/${code}.svg`}
      width={size}
      height={size}
      alt={ch}
      draggable={false}
      loading="lazy"
    />
  );
}

const EMOJI_RE = new RegExp(`(${Object.keys(CODE).join("|")})`, "g");

/** Replace known emoji characters in a text with vivid Twemoji images. */
export function emojiText(text: string, size = 18): ReactNode {
  const parts = text.split(EMOJI_RE);
  if (parts.length === 1) return text;
  return parts.map((p, i) => (CODE[p] ? <Em key={i} ch={p} size={size} /> : p));
}
