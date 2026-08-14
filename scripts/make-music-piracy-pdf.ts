/*
 * Build a text-only PDF titled "Music Piracy" for US 114055
 * (Ethics and professionalism for the computer industry in SA).
 *
 * Styled to match Microsoft Azure design guidelines:
 *   - Segoe UI typography (loaded from the Windows Fonts folder and
 *     embedded into the PDF, so viewers do not need Segoe UI installed).
 *   - Azure blue palette (Communication Blue #0078D4 and friends) and
 *     Fluent neutrals for text and rules.
 *   - Azure-style cover with a blue banner and dotted accent.
 *   - Azure-style info callouts with a left accent bar.
 *
 * Run:  npx tsx scripts/make-music-piracy-pdf.ts
 * Out:  public/downloads/Music-Piracy.pdf
 */
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { existsSync, mkdirSync, createWriteStream } from "node:fs";
import PDFDocument from "pdfkit";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "downloads");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
const OUT_PATH = join(OUT_DIR, "Music-Piracy.pdf");

// ---------------------------------------------------------------- Fonts
// Segoe UI is Microsoft's default UI typeface (used across Azure, Microsoft
// Learn and Fluent). Load it directly from the Windows Fonts folder so the
// generated PDF matches Microsoft Azure documentation styling.
const WIN_FONTS = "C:/Windows/Fonts";
const FONT_FILES = {
  regular: join(WIN_FONTS, "segoeui.ttf"),
  bold: join(WIN_FONTS, "segoeuib.ttf"),
  italic: join(WIN_FONTS, "segoeuii.ttf"),
  light: join(WIN_FONTS, "segoeuil.ttf"),
  semilight: join(WIN_FONTS, "segoeuisl.ttf"),
  boldItalic: join(WIN_FONTS, "segoeuiz.ttf"),
};
const HAS_SEGOE = Object.values(FONT_FILES).every((f) => existsSync(f));

// Font aliases we will refer to throughout the script. If Segoe UI is not
// available, fall back to Helvetica (pdfkit's built-in Neue-Helvetica-like
// sans, which is the closest match to Segoe UI's geometry).
const F_REGULAR = HAS_SEGOE ? "SegoeUI" : "Helvetica";
const F_BOLD = HAS_SEGOE ? "SegoeUI-Bold" : "Helvetica-Bold";
const F_ITALIC = HAS_SEGOE ? "SegoeUI-Italic" : "Helvetica-Oblique";
const F_LIGHT = HAS_SEGOE ? "SegoeUI-Light" : "Helvetica";
const F_SEMILIGHT = HAS_SEGOE ? "SegoeUI-Semilight" : "Helvetica";

// A4 portrait
const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN_X = 56;
const MARGIN_TOP = 72;
const MARGIN_BOTTOM = 68;

const doc = new PDFDocument({
  size: [PAGE_W, PAGE_H],
  margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_X, right: MARGIN_X },
  autoFirstPage: false,
  bufferPages: true,
  info: {
    Title: "Music Piracy",
    Author: "ITSS Learn",
    Subject: "US 114055 \u2014 Ethics and professionalism for the computer industry in SA",
    Keywords: "music piracy, software piracy, ethics, BSA, RIAA, SAFACT, bidorbuy",
  },
});

if (HAS_SEGOE) {
  doc.registerFont("SegoeUI", FONT_FILES.regular);
  doc.registerFont("SegoeUI-Bold", FONT_FILES.bold);
  doc.registerFont("SegoeUI-Italic", FONT_FILES.italic);
  doc.registerFont("SegoeUI-Light", FONT_FILES.light);
  doc.registerFont("SegoeUI-Semilight", FONT_FILES.semilight);
  doc.registerFont("SegoeUI-BoldItalic", FONT_FILES.boldItalic);
}

doc.pipe(createWriteStream(OUT_PATH));

// ---------------------------------------------------------------- Colours
// Microsoft Azure / Fluent palette. Communication Blue is the primary
// Azure brand colour used across azure.microsoft.com and Microsoft Learn.
const AZURE_BLUE = "#0078D4"; // Communication Blue — primary
const AZURE_BLUE_DARK = "#005A9E"; // hover / darker accent
const AZURE_BLUE_DEEP = "#003C71"; // deep navy for cover
const AZURE_BLUE_TINT = "#DEECF9"; // very pale blue for chips
const AZURE_CYAN = "#50E6FF"; // accent used on marketing pages
const INK = "#201F1E"; // Fluent neutral primary text
const INK_SECONDARY = "#605E5C"; // Fluent neutral secondary text
const INK_TERTIARY = "#8A8886"; // Fluent neutral tertiary
const RULE = "#EDEBE9"; // Fluent neutral divider
const CARD_BG = "#F3F9FD"; // pale-blue callout background (Azure info)
const PAGE_TINT = "#FAF9F8"; // very subtle page tint used sparingly

// ---------------------------------------------------------------- Helpers
function ensureRoom(minHeight: number) {
  const bottom = PAGE_H - MARGIN_BOTTOM;
  if (doc.y + minHeight > bottom) doc.addPage();
}

/** Fluent/Azure heading: bold Segoe UI with a subtle blue accent bar to the left
 *  for level-1 titles, and a hairline rule below level-1/2 titles. */
function heading(text: string, opts: { level?: 1 | 2 | 3; space?: number } = {}) {
  const { level = 2, space = 10 } = opts;
  const size = level === 1 ? 24 : level === 2 ? 15 : 11.5;
  ensureRoom(size + 24);
  doc.moveDown(space / 12);
  const startY = doc.y;
  if (level === 1) {
    // Azure blue accent bar to the left of top-level section titles.
    doc
      .save()
      .rect(MARGIN_X, startY + 3, 4, size + 4)
      .fillColor(AZURE_BLUE)
      .fill()
      .restore();
    doc
      .font(F_BOLD)
      .fontSize(size)
      .fillColor(INK)
      .text(text, MARGIN_X + 14, startY, {
        width: PAGE_W - MARGIN_X - (MARGIN_X + 14),
        align: "left",
      });
  } else {
    doc
      .font(F_BOLD)
      .fontSize(size)
      .fillColor(level === 2 ? AZURE_BLUE_DARK : INK)
      .text(text, { align: "left" });
  }
  if (level <= 2) {
    const y = doc.y + 4;
    doc
      .save()
      .moveTo(MARGIN_X, y)
      .lineTo(PAGE_W - MARGIN_X, y)
      .lineWidth(0.6)
      .strokeColor(RULE)
      .stroke()
      .restore();
    doc.moveDown(0.7);
  } else {
    doc.moveDown(0.35);
  }
}

/** Body paragraph in Segoe UI. Justified for a documentation-like feel. */
function paragraph(
  text: string,
  opts: { italic?: boolean; muted?: boolean; size?: number; indent?: number } = {},
) {
  const { italic = false, muted = false, size = 10.5, indent = 0 } = opts;
  ensureRoom(size + 8);
  doc
    .font(italic ? F_ITALIC : F_REGULAR)
    .fontSize(size)
    .fillColor(muted ? INK_SECONDARY : INK)
    .text(text, {
      align: "justify",
      indent,
      lineGap: 2.6,
      paragraphGap: 6,
    });
}

/** Azure-doc-style info callout: pale-blue background with a Communication
 *  Blue accent bar on the left. Title in Segoe UI Bold, body in Segoe UI. */
function callout(title: string, lines: string[]) {
  const size = 10.5;
  const padX = 14;
  const padY = 12;
  const width = PAGE_W - MARGIN_X * 2;

  doc.font(F_BOLD).fontSize(size);
  const titleH = doc.heightOfString(title, { width: width - padX * 2 });
  doc.font(F_REGULAR).fontSize(size);
  const bodyH = lines.reduce(
    (acc, line) =>
      acc + doc.heightOfString(line, { width: width - padX * 2, lineGap: 2.6 }) + 4,
    0,
  );
  const boxH = titleH + bodyH + padY * 2 + 4;

  ensureRoom(boxH + 8);
  const x = MARGIN_X;
  const y = doc.y;
  doc.save().roundedRect(x, y, width, boxH, 4).fillColor(CARD_BG).fill().restore();
  doc
    .save()
    .rect(x, y, 4, boxH)
    .fillColor(AZURE_BLUE)
    .fill()
    .restore();

  doc
    .font(F_BOLD)
    .fontSize(size)
    .fillColor(AZURE_BLUE_DARK)
    .text(title, x + padX, y + padY, { width: width - padX * 2 });
  doc.moveDown(0.2);
  for (const line of lines) {
    doc
      .font(F_REGULAR)
      .fontSize(size)
      .fillColor(INK)
      .text(line, { width: width - padX * 2, lineGap: 2.6 });
    doc.moveDown(0.2);
  }
  doc.y = y + boxH + 10;
}

function bulletList(items: string[]) {
  const size = 10.5;
  const bulletX = MARGIN_X + 4;
  const textX = MARGIN_X + 18;
  const textWidth = PAGE_W - MARGIN_X - textX;
  for (const item of items) {
    ensureRoom(size + 8);
    const y = doc.y;
    doc
      .font(F_BOLD)
      .fontSize(size)
      .fillColor(AZURE_BLUE)
      .text("\u25A0", bulletX, y + 1, { lineBreak: false });
    doc
      .font(F_REGULAR)
      .fontSize(size)
      .fillColor(INK)
      .text(item, textX, y, { width: textWidth, align: "justify", lineGap: 2.6 });
    doc.moveDown(0.45);
  }
  doc.moveDown(0.2);
}

/** Small pill chip (used on the cover) matching Azure's tag styling. */
function chip(x: number, y: number, label: string) {
  const padX = 10;
  const padY = 5;
  const size = 9.5;
  doc.font(F_BOLD).fontSize(size);
  const w = doc.widthOfString(label) + padX * 2;
  const h = size + padY * 2;
  doc
    .save()
    .roundedRect(x, y, w, h, h / 2)
    .fillColor("#FFFFFF")
    .fillOpacity(0.14)
    .fill()
    .fillOpacity(1)
    .restore();
  doc
    .font(F_BOLD)
    .fontSize(size)
    .fillColor("#FFFFFF")
    .text(label, x + padX, y + padY - 1, { lineBreak: false });
  return w;
}

function pageFooter(pageNum: number, total?: number) {
  const savedBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  // Thin blue rule above the footer for a subtle Azure-doc feel.
  doc
    .save()
    .moveTo(MARGIN_X, PAGE_H - MARGIN_BOTTOM + 18)
    .lineTo(PAGE_W - MARGIN_X, PAGE_H - MARGIN_BOTTOM + 18)
    .lineWidth(0.5)
    .strokeColor(RULE)
    .stroke()
    .restore();
  doc.save();
  doc
    .font(F_REGULAR)
    .fontSize(8.5)
    .fillColor(INK_SECONDARY)
    .text(
      "Music Piracy  \u2022  US 114055 Ethics & Professionalism",
      MARGIN_X,
      PAGE_H - MARGIN_BOTTOM + 26,
      { width: (PAGE_W - MARGIN_X * 2) / 2, align: "left", lineBreak: false },
    );
  doc
    .font(F_REGULAR)
    .fontSize(8.5)
    .fillColor(INK_SECONDARY)
    .text(
      total ? `Page ${pageNum} of ${total}` : `Page ${pageNum}`,
      PAGE_W / 2,
      PAGE_H - MARGIN_BOTTOM + 26,
      { width: (PAGE_W - MARGIN_X * 2) / 2, align: "right", lineBreak: false },
    );
  doc.restore();
  doc.page.margins.bottom = savedBottom;
}

// Number pages as we go.
let pageNum = 0;
doc.on("pageAdded", () => {
  pageNum += 1;
});

// ---------------------------------------------------------------- Cover
doc.addPage();

// Deep-blue Azure banner covering the top ~40% of the page.
const bannerH = 340;
doc.save();
doc.rect(0, 0, PAGE_W, bannerH).fillColor(AZURE_BLUE_DEEP).fill();
// A darker overlay strip at the very top for the classic Azure header stripe.
doc.rect(0, 0, PAGE_W, 6).fillColor(AZURE_BLUE).fill();
// A cyan accent ribbon along the bottom of the banner.
doc.rect(0, bannerH - 5, PAGE_W * 0.55, 5).fillColor(AZURE_CYAN).fill();
doc.rect(PAGE_W * 0.55, bannerH - 5, PAGE_W * 0.45, 5).fillColor(AZURE_BLUE).fill();
doc.restore();

// Decorative dotted grid (Fluent/Azure marketing pages use light dot patterns)
doc.save();
doc.fillColor("#FFFFFF").fillOpacity(0.08);
for (let dx = PAGE_W - 180; dx < PAGE_W - 20; dx += 14) {
  for (let dy = 34; dy < 190; dy += 14) {
    doc.circle(dx, dy, 1.4).fill();
  }
}
doc.fillOpacity(1);
doc.restore();

// Small "Microsoft-style" wordmark block in the top-left of the banner.
doc
  .font(F_SEMILIGHT)
  .fontSize(11)
  .fillColor("#FFFFFF")
  .text("ITSS Learn  |  Microsoft Azure styling", MARGIN_X, 34, {
    characterSpacing: 0.4,
    lineBreak: false,
  });

// Eyebrow
doc
  .font(F_BOLD)
  .fontSize(11)
  .fillColor(AZURE_CYAN)
  .text("US 114055  \u00b7  NQF 5  \u00b7  Ethics & Professionalism", MARGIN_X, 108, {
    characterSpacing: 1.6,
    lineBreak: false,
  });

// Main title \u2014 Segoe UI Light at a large display size, matching Azure hero titles.
doc
  .font(F_LIGHT)
  .fontSize(56)
  .fillColor("#FFFFFF")
  .text("Music Piracy", MARGIN_X, 132, { lineBreak: false });

// Subhead
doc
  .font(F_SEMILIGHT)
  .fontSize(14)
  .fillColor("#DEECF9")
  .text(
    "A learner reader on music, software and online piracy \u2014 the ethics, the industry, and the South African picture.",
    MARGIN_X,
    210,
    { width: PAGE_W - MARGIN_X * 2 - 40, lineGap: 3 },
  );

// Chips row
let chipX = MARGIN_X;
const chipY = bannerH - 46;
for (const label of ["Ethics", "Piracy", "BSA", "SAFACT", "South Africa"]) {
  chipX += chip(chipX, chipY, label) + 8;
}

// Content area below the banner.
doc.x = MARGIN_X;
doc.y = bannerH + 30;

heading("In this reader", { level: 3, space: 4 });
bulletList([
  "A reader\u2019s dilemma: a friend burned me a pirated CD \u2014 what do I do?",
  "Industry toughens on piracy (BSA & Microsoft SA)",
  "South Africa losing 30 000 jobs to piracy (Daily Dispatch, 2006)",
  "What is piracy? \u2014 forms of software piracy and why they matter",
  "Bidorbuy declares war against piracy in South Africa (2005)",
]);

heading("Why this matters for US 114055", { level: 3, space: 4 });
paragraph(
  "Unit Standard 114055 asks you to demonstrate an awareness of ethics and professionalism for the computer industry in South Africa. Piracy \u2014 of music, software, film and games \u2014 is one of the clearest everyday ethics questions IT practitioners face. This reader lets you weigh the arguments (and excuses) for and against piracy, and see the real cost to the local industry and to jobs.",
);

// ---------------------------------------------------------------- Section 1: Q&A
doc.addPage();

heading("A reader\u2019s dilemma \u2014 the burned CD", { level: 1 });

callout("Q.", [
  "A few weeks ago a friend \u2018burned\u2019 me a pirate copy of a new CD he\u2019d just bought. It\u2019s not a band I would usually have bothered with, but I have to admit the music is pretty good. However I now feel guilty every time I play the CD. Should I give the CD back, and risk alienating my friend? Should I just throw it away and hope he doesn\u2019t raise it in conversation, forcing me into an awkward situation? Or can I keep the CD with a clear conscience, knowing that I didn\u2019t make the illegal copy, and that it\u2019s pretty unlikely that I would ever have bought a copy anyway?",
]);

heading("A.", { level: 3 });

paragraph(
  "Music piracy, while not as sexy as the old skull-and-crossbones kind, is certainly a good deal more widespread. \u2018Piracy\u2019 is generally considered to include:",
  { italic: true },
);
bulletList([
  "\u2018Pirate recordings\u2019 \u2014 where it\u2019s just the music itself that is copied, usually by ordinary people using ordinary equipment on a not-for-profit basis (\u2018Dude, I just got the new Kaiser Chiefs album \u2014 do you want me to burn you a copy?\u2019).",
  "\u2018Counterfeiting\u2019 \u2014 which involves copying the music as well as the packaging, and generally involves attempting to pass off the copy as the real thing.",
  "\u2018Online piracy\u2019 \u2014 basically the same as either making a pirate recording or counterfeiting, only it\u2019s done via the internet.",
  "\u2018Bootlegging\u2019 \u2014 the recording and trading of a performance, usually a live concert, which has not been officially released by the artist or her representative.",
]);

paragraph(
  "RIAA, the Recording Industry Association of America, claims that the recording industry \u2018loses\u2019 around 4.2 billion U.S. dollars to piracy each year. This figure is reached by way of an inference that each pirate transaction represents a lost legitimate sale. This is obviously overly simplistic: people buy pirated music, or make their own copies, because doing so is cheaper than buying the real thing from a retailer. It\u2019s not at all obvious that if the pirated version were not available then all those people would head straight for the nearest Musica. That said, it\u2019s pretty obvious that full-blown music counterfeiting is both illegal and unethical, and we ought not to support this industry by buying cheap counterfeits at flea markets and street traders. Your query, however, is about home-made pirate recordings.",
  { italic: true },
);

paragraph(
  "Many people who make pirate copies of CDs, particularly the \u2018home pirates\u2019 who don\u2019t actually make money out of piracy, think of themselves as modern day Robin Hoods \u2014 stealing from the obscenely rich recording company fat cats and their seriously overpaid \u2018artists\u2019, and giving to the poor (er, themselves). RIAA tries to undermine that kind of thinking by claiming that it\u2019s the consumer who is the \u2018ultimate victim\u2019 of piracy. Why? Because the poor consumer who buys a pirated copy is thereby denied the superior sound quality and flash packaging that comes with the real thing. Ag Shame.",
  { italic: true },
);

paragraph(
  "While RIAA\u2019s argument is not particularly convincing, it\u2019s not clear that the Robin Hood argument holds water either. Presumably the idea is that in this sort of case stealing is justified by the nastiness of the person or persons being stolen from, and the real need of the person or persons the stealing is supposed to benefit. But does this really hold in this case? While it\u2019s hard to feel too sorry for either Sony or their latest boy-band, we do need to ask ourselves whether they\u2019re really doing something wicked by making money out of their product. Perhaps the argument is that CDs are overpriced. Well, in a free market system there\u2019s a pretty good way of driving some product\u2019s price down \u2014 don\u2019t buy it. If enough people agree with you, then the product won\u2019t sell and price will eventually come down. If it doesn\u2019t, then you were probably wrong about the overpricing in the first place. And let\u2019s face it, it\u2019s not as if music is such a fundamental need that you might die while waiting for the market to make things right. If you\u2019re really desperate, there\u2019s always the radio.",
  { italic: true },
);

paragraph(
  "There are those who believe that there is price fixing going on in the music industry, and that piracy is a legitimate form of protest against the music barons. But if protest is really your goal, rather than just a convenient excuse for stealing, then copying your buddy\u2019s new CD is not a particularly effective way of doing it. Protests need to attract attention. If you REALLY want to protest, and don\u2019t like any of the wide range of legal means of protesting that there are out there, then one good route would be to start openly selling counterfeit CDs outside your nearest big-name-brand record store, and wait to get arrested. You\u2019ll then get more than enough opportunity to get your message out through the media.",
  { italic: true },
);

paragraph(
  "If protest is not really what\u2019s on your agenda, what should you do about the situation you describe? If you do really like the CD, buy yourself a legit copy and toss away the pirated version. If your buddy is concerned about why you didn\u2019t keep the pirated CD, you can always try RIAA\u2019s \u2018ultimate victim\u2019 line. And if you decide not to buy the CD, then get rid of the pirated version anyway, and go out and buy two copies of the latest release from your favourite South African artist or band \u2014 one for you and one for your friend.",
  { italic: true },
);

// ---------------------------------------------------------------- Section 2: Industry toughens
doc.addPage();

heading("Industry toughens on piracy", { level: 1 });
paragraph(
  "An insert on software piracy in South Africa, measured against the global picture.",
  { muted: true, italic: true, size: 10 },
);

paragraph(
  "HALF of the software in use in South Africa is illegal \u2014 that means it has not been paid for or is pirated. In the US 30% of software is pirated and in the UK, 35%. The rest of Africa has a software piracy rate into the 90% range.",
);
paragraph(
  "The Business Software Alliance (BSA) \u2014 an anti-piracy umbrella body made up of large software companies \u2014 is getting tougher on offenders. Although in the past few months R300 000 has been recovered in out-of-court settlements, the BSA is in future going to prosecute offenders to the full extent of the law.",
);
paragraph(
  "The latest world-wide software piracy figures released recently by the BSA show that South Africa is one of the few countries in the world that suffered from an increased rate of software piracy from 1997 to 1998.",
);
paragraph(
  "Despite the decrease in the world-wide rate to 38% (from 40%), the amount of software pirated in South Africa rose to 49% (from 48%). This translates into a retail revenue loss to the local software industry of R580-million.",
);
paragraph(
  "\u201CThe fact that the South African piracy rate increased is indicative of the extent of the local piracy problem,\u201D says Garry Hodgson, director of legalisation at Microsoft South Africa.",
);
paragraph(
  "\u201CFor almost every copy of software sold, another is pirated or stolen. Theoretically, software resellers can get a rough indication of how much revenue they could gain through the eradication of software piracy by merely doubling their sales figures.\u201D",
);
paragraph(
  "The illegal copying and distribution of software programs is the main obstacle to the growth of the software sector, which is reflected in revenue losses estimated at US$11-billion to the worldwide industry in 1998. This is just one of the findings published in the 1998 report on software piracy prepared by the International Planning Research Corporation (IPRC) for the BSA and Software and Information Industry Association (SAAI).",
);
paragraph(
  "The IPRC report largely attributes the decreased rate of piracy world-wide to international economic recessions, particularly Asia, Eastern Europe and the Middle East. This suggests that the decline in piracy rates and dollar losses experienced in 1998 is not expected to continue into the future without increased enforcement of software copyright laws.",
);
paragraph(
  "\u201CThe increase in the local software piracy rate indicates that this is a crime that is not being taken seriously enough in South Africa,\u201D says Hodgson. \u201CBuying, selling or illegally copying software is supporting the South African crime problem and while Microsoft and the BSA will continue to raise public awareness about products that are legally protected by copyright, it is only through stricter legislation that this type of crime can be stopped. South Africans have to realise that software piracy is stealing \u2014 no more, no less \u2014 and criminals deserve to be punished.\u201D",
);
paragraph(
  "As of July 1, 1999 the South African Government has six months to improve the local protection of intellectual property rights or face further unpleasantness from the Clinton administration\u2019s fair trade enforcers. The US trade representative will be seeking assurances that government computers have been purged of unlicensed software and that SA will be in full compliance with the World Trade Organisation\u2019s trade-related intellectual property agreement (TRIPS) by January 1 next year.",
);
paragraph(
  "The South African law does allow for some enforcement of copyright violation, and amendments to the copyright law in South Africa (the Intellectual Property Laws Amendment Act, effective October 1, 1997) have brought SA closer to compliance with its TRIPS obligations. This is especially true in the scope of protection given to computer programs, protection of compilations of data and databases; and terms of protection for audio-visual works. However, even after these amendments, numerous areas of South Africa\u2019s enforcement practices fall short of full TRIPS compliance.",
);

// ---------------------------------------------------------------- Section 3: SA losing 30 000 jobs
doc.addPage();

heading("South Africa losing 30 000 jobs to piracy", { level: 1 });
paragraph("By Tiisetso Motsoeneng, Daily Dispatch, 24 May 2006", {
  muted: true,
  italic: true,
  size: 10,
});

paragraph(
  "About 36% of the software used by South African businesses is illegal, depriving more than 30 000 people of jobs in the multibillion rand information technology (IT) industry, say experts.",
);
paragraph(
  "Although piracy rates among local businesses dropped 1% compared to last year, industry players said the numbers were still significantly high, representing at least R1,2bn in economic losses. \u201CSoftware piracy remains one of the major hurdles to realising the potential of the information economy in South Africa, on the continent and around the world,\u201D said chairperson of the local arm of the Business Software Alliance (BSA) Stephan le Roux.",
);
paragraph(
  "Le Roux was speaking on Tuesday at the release of a study commissioned by BSA, which found that some countries had piracy rates topping 90%, with Africa and the Middle East\u2019s gross domestic product losing about R10,3bn last year. BSA is an industry body representing commercial software developers and their hardware partners. Its vice-chairperson Andrew Lindstrom said plenty of jobs could be created if the intellectual property protection laws were robustly enforced.",
);
paragraph(
  "Besides software, South African intellectual property laws cover industries such as film, books and music.",
);
paragraph(
  "The BSA study comes amid concerted effort from law enforcement officials to crackdown on DVD piracy, which crippled sales of the latest Leon Schuster movie Mama Jack and Oscar-winner Tsotsi. A group of music heavyweights recently raided Johannesburg streets to wipe out pirated music CDs sold in some shops and by street vendors. BSA said that software piracy in the local industry has led to unfair competition, which has jeopardised foreign direct investment from international companies as there were low market returns.",
);
paragraph(
  "Analysts said government needed to use all avenues to tackle the steep unemployment rate, which is sitting at 26,7%.",
);
paragraph(
  "The report covering 97 countries pointed to a global software piracy rate of 35%, unchanged from last year\u2019s level. \u201CThis represents at least $34bn in economic losses worldwide \u2014 calculated according to the retail value of pirated software,\u201D BSA said.",
);
paragraph(
  "The report also painted a gloomy picture of African countries\u2019 potential to implement successful intellectual property legislation, saying that software piracy on the continent averaged more than 70%. Globally, piracy was most prevalent in Zimbabwe and Vietnam, which both showed rates of 90%.",
);
paragraph(
  "\u201CWhile we are upbeat that piracy levels are dropping, there is still a concern for our local economy that over a third of the software in use is illegal. This concern rises when you look at some countries in Africa, where as few as one in ten copies of packaged software are legitimately paid for,\u201D said le Roux. He added that lowering software piracy would take constant work and investment but those investments could unlock benefits for the industry and local economies.",
);
paragraph(
  "BSA said that if the global piracy rate were to drop 10% to 25%, about 2,4 million new jobs would be created, and a further $67bn in tax revenues would be added worldwide.",
);

// ---------------------------------------------------------------- Section 4: What is piracy?
doc.addPage();

heading("What is piracy?", { level: 1 });

paragraph(
  "Software piracy has become an important topic affecting the software industry internationally, including individual and business users of all software products worldwide.",
);
paragraph(
  "Software piracy is the failure to comply with software license agreements. Piracy, in any form, is an unlawful action and offenders are liable to either civil or criminal prosecution. It is important that all software users and resellers understand the different forms of software piracy in order to comply with the law and protect themselves and their business.",
);

heading("The various forms of software piracy", { level: 3 });
bulletList([
  "End User Copying \u2014 A licensed software user passes their software onto friends, business colleagues and family to copy indiscriminately. Or in the case of volume software licenses, users and/or businesses under report the number of computers on which the software is installed.",
  "Reseller Copying \u2014 Resellers pass their software onto their clients.",
  "Counterfeiting \u2014 Criminals copy the software and collateral, such as manuals, and sell it as the original product.",
]);

paragraph(
  "Software piracy negatively impacts customers, resellers and software vendors. Lower vendor revenues, as a result of software piracy, limit the industry\u2019s ability to re-invest funds in research and development (R&D) and continuously maintain and improve service and support infrastructures. Ongoing investment in R&D ensures that software vendors have the ability to keep their users at the forefront of the latest technology developments.",
);
paragraph(
  "Furthermore, purchasing pirate software can have a damaging effect on your company as the software may introduce viruses to your system, destroying mission critical data. Users of pirate products do not benefit from the quality and reliability guarantees provided to lawful, licensed customers and will be unable to access technical software support.",
);

// ---------------------------------------------------------------- Section 5: Bidorbuy
doc.addPage();

heading("Bidorbuy declares war against piracy in South Africa", { level: 1 });
paragraph("Bidorbuy press release \u2014 13 September 2005", {
  muted: true,
  italic: true,
  size: 10,
});

paragraph(
  "bidorbuy, one of South Africa\u2019s largest online marketplaces, has taken a proactive stance against the selling of pirated goods online. Although e-commerce has shown tremendous growth over the past few years, its uptake has been hindered by various factors, one being consumers\u2019 concerns regarding pirated or illicit goods being sold online.",
);
paragraph(
  "Looking at the number of people going online each year, the Internet has turned into a serious business medium, as the 25 000 people with dial-up Internet access in 1994 turned into an overall market of more than 3 million users in 2004. \u201CWith the rapid growth and uptake of this medium locally, protection of intellectual property on the Internet has become an increasingly urgent issue,\u201D says Andy Higgins, managing director at bidorbuy. \u201CDue to the difficulty controlling this aspect, more dealers of pirated or illicit goods will switch to the Internet to promote and sell their goods.\u201D",
);
paragraph(
  "\u201CMany people do not realise the high stakes involved, as failure to enforce piracy regulations in cyberspace could have repercussions for the economy as a whole,\u201D says Higgins. \u201CPiracy is nothing less than serious theft. It is a crime that impacts right across our society, from government to the retail sector and right down to the individual customer, who, in buying pirated goods, end up with inferior products. The only winners are the criminals \u2014 something that needs to be stopped immediately!\u201D",
);
paragraph(
  "bidorbuy has acknowledged combating piracy as a top priority. Although the company is not experts in identifying pirated goods, it is working closely with industry bodies and authorities to ensure the problem of pirated goods on the www.bidorbuy.co.za site is combated effectively. Such bodies include the South African Police Services (SAPS), the Southern African Federation against Copyright Theft (SAFACT), the Business Software Alliance (BSA) and the Independent Communications Authority of South Africa (ICASA).",
);
paragraph(
  "SAFACT, a trade association representing the entertainment industry, recently entered into an agreement with bidorbuy in the fight against the sale of pirated DVD movies and games online. \u201CWhen considering the fact that the film industry loses approximately R200 million per annum through piracy, the agreement with bidorbuy is an important step forward in our continuous fight against this crime,\u201D says Fred Potgieter, general manager at SAFACT. \u201CTherefore we salute bidorbuy for this initiative and encourage other online auction sites to take similar responsibility to monitor what is being offered for sale on its site. This is of particular importance when we consider the increasing growth of Internet users in South Africa, many of which unfortunately use the Internet as a conduit for the sale of pirated films. In the USA and Europe for example, the greatest threat to the software industry is the Internet and as such we should prepare for this trend locally.\u201D",
);
paragraph(
  "The issue of software piracy and the resale of counterfeit goods have far-reaching implications \u2014 not only for the manufacturers of the products but for the economies of the countries in which the practice proliferates. IDC, the international research house, released the results of its software piracy study earlier this year after surveying 87 countries worldwide. \u201CSouth Africa\u2019s piracy rate stands at 37 percent \u2014 up one percent from last year and close to the global average of 35 percent. The general African average is a staggering 80 percent, with countries such as Zimbabwe topping 90 percent. This translates into Africa\u2019s economy suffering to the tune of $1bn per year. EMEA loses around $15bn. Globally, piracy costs approximately $33bn,\u201D explains Stephan Le Roux, chairman of the BSA in South Africa.",
);
paragraph(
  "\u201CPiracy remains a serious problem in South Africa and we are dedicated to play a role in the ongoing war that is being waged against the illegal importation and selling of counterfeit and pirated goods in the country. As such, we are keeping with our commitment to making the online marketplace a safe and secure place to conduct business,\u201D concludes Higgins.",
);

// ---------------------------------------------------------------- Finish
// Write footers on every page (except cover) now that we know the total.
const totalPages = pageNum;
for (let i = 1; i < totalPages; i++) {
  doc.switchToPage(i);
  pageFooter(i + 1, totalPages);
}
doc.flushPages();
doc.end();
doc.on("finish", () => {
  console.log(`Wrote ${OUT_PATH} (${totalPages} pages)`);
});
