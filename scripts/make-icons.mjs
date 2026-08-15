/**
 * Generates the PWA icon set (public/icons/*) from an inline SVG.
 * Run with: node scripts/make-icons.mjs
 */
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const svg = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2e86ff"/>
      <stop offset="1" stop-color="#0b3f8a"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="${pad ? 0 : 96}" fill="url(#g)"/>
  <!-- graduation cap -->
  <g transform="translate(256 236)">
    <polygon points="0,-86 172,-22 0,42 -172,-22" fill="#ffffff"/>
    <path d="M -96 8 L -96 74 Q 0 128 96 74 L 96 8 L 0 44 Z" fill="#dbe8ff"/>
    <rect x="150" y="-22" width="14" height="96" rx="7" fill="#ffd35c"/>
    <circle cx="157" cy="84" r="16" fill="#ffd35c"/>
  </g>
  <text x="256" y="436" font-family="Segoe UI, Arial, sans-serif" font-size="88" font-weight="700"
        text-anchor="middle" fill="#ffffff" letter-spacing="4">ITSS</text>
</svg>`;

mkdirSync("public/icons", { recursive: true });

await sharp(Buffer.from(svg(false))).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(Buffer.from(svg(false))).resize(512, 512).png().toFile("public/icons/icon-512.png");
// maskable: full-bleed background (safe zone handled by the plain rect)
await sharp(Buffer.from(svg(true))).resize(512, 512).png().toFile("public/icons/maskable-512.png");
await sharp(Buffer.from(svg(false))).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png");

console.log("icons written to public/icons/");
