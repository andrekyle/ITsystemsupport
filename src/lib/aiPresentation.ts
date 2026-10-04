export interface AiPresentationSlide {
  title: string;
  bullets: string[];
}

export async function createAiPresentation(
  unit: { us: string; title: string },
  slides: AiPresentationSlide[]
): Promise<File> {
  if (!slides.length) throw new Error("The AI presentation has no slides.");
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = unit.title;
  pptx.subject = `US ${unit.us} AI-generated lesson presentation`;
  pptx.author = "ITSS Learn";
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos",
  };

  const navy = "479EF5";
  const blue = "479EF5";
  const grey = "637083";
  const line = "D5DCE6";

  const cover = pptx.addSlide();
  cover.background = { color: "FFFFFF" };
  cover.addShape("rect", { x: 0, y: 0, w: 13.333, h: 0.12, line: { color: blue, transparency: 100 }, fill: { color: blue } });
  cover.addText(`UNIT STANDARD ${unit.us}`, { x: 0.8, y: 1.35, w: 10.8, h: 0.4, fontFace: "Aptos", fontSize: 16, bold: true, color: blue, charSpacing: 1.5, margin: 0 });
  cover.addText(unit.title, { x: 0.8, y: 2.05, w: 10.8, h: 1.45, fontFace: "Aptos Display", fontSize: 34, bold: true, color: navy, margin: 0, breakLine: false });
  cover.addText("ITSS Learn · Editable PowerPoint", { x: 0.8, y: 6.8, w: 8, h: 0.32, fontFace: "Aptos", fontSize: 12, color: grey, margin: 0 });

  slides.forEach((entry, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addShape("rect", { x: 0, y: 0, w: 13.333, h: 0.09, line: { color: blue, transparency: 100 }, fill: { color: blue } });
    slide.addText(`US ${unit.us} · LESSON ${index + 1}`, { x: 0.7, y: 0.35, w: 10, h: 0.28, fontFace: "Aptos", fontSize: 12, bold: true, color: blue, charSpacing: 1.2, margin: 0 });
    slide.addText(entry.title, { x: 0.7, y: 0.82, w: 11.8, h: 0.8, fontFace: "Aptos Display", fontSize: 27, bold: true, color: navy, margin: 0, valign: "top", breakLine: false });
    slide.addShape("line", { x: 0.7, y: 1.72, w: 11.95, h: 0, line: { color: line, width: 1 } });
    const bulletTexts = entry.bullets.map((text) => ({
      text,
      options: { bullet: { indent: 18 }, hanging: 4, breakLine: true, paraSpaceAfter: 16 },
    }));
    slide.addText(bulletTexts, {
      x: 0.9,
      y: 2.05,
      w: 11.1,
      h: 4.45,
      fontFace: "Aptos",
      fontSize: 20,
      color: navy,
      margin: 0,
      valign: "top",
      breakLine: false,
      fit: "shrink",
      paraSpaceAfter: 16,
    });
    slide.addText(`ITSS Learn · ${index + 1} / ${slides.length}`, { x: 0.7, y: 7.0, w: 11.95, h: 0.25, fontFace: "Aptos", fontSize: 11, color: grey, margin: 0, align: "right" });
  });

  const blob = await pptx.write({ outputType: "blob" }) as Blob;
  return new File([blob], `US-${unit.us}-AI-Presentation.pptx`, {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
}
