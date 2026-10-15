import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { PracticalTask } from "../src/components/PracticalTask";
import { importUnitSource } from "../src/lib/unitSourceImport";
import { practicalTaskFromSource, sourceDocumentText } from "../src/lib/practicalTaskImport";
import type { PracticalTaskDocument, Profile } from "../src/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const words = (text: string) => text.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

export async function testUploadedWorkbook() {
  const response = await fetch("/SAQA-114046%20-%20%20%20Learner%20Workbook.pdf");
  assert(response.ok, "The actual reference workbook must be available for conversion.");
  const source = await importUnitSource(new File([await response.blob()], "reference-workbook.pdf", { type: "application/pdf" }));
  const documentModel = practicalTaskFromSource(source, "reference-workbook.pdf", "Reference unit");
  assert(documentModel.sourcePageCount === 17, "The reference contains all 17 source pages.");
  assert(words(sourceDocumentText(documentModel)) === words(source), "Conversion must retain every source word in order.");
  const before = JSON.stringify(documentModel);
  const fixture = document.createElement("div");
  document.body.append(fixture);
  const root = createRoot(fixture);
  const profile = { id: "uploaded-workbook-test", name: "Test learner", role: "Learner" } as Profile;
  const saved: Record<string, string | boolean> = { unrelated: "Keep existing progress" };
  const mount = (model: PracticalTaskDocument, prefix = "learner-workbook.") => flushSync(() => root.render(<PracticalTask
    document={model} unitId="114046" presentation="workbook" profile={profile} storagePrefix={prefix}
    values={saved} onChange={(key, value) => { saved[key] = value; }}
  />));
  try {
    mount(documentModel);
    const pages = Array.from(fixture.querySelectorAll<HTMLElement>("[data-source-page]"));
    assert(pages.length === 17 && pages.every((page, index) => page.dataset.sourcePage === String(index + 1)), "Each source page must appear once, in order.");
    const cover = fixture.querySelector<HTMLElement>(".lw-cover")!;
    const title = "DEMONSTRATE AN UNDERSTANDING OF ISSUES AFFECTING THE MANAGEMENT OF A LOCAL AREA COMPUTER NETWORK (LAN)";
    assert(cover.querySelector("h1")?.textContent === title, "Cover title must come from the actual upload, joining its wrapped title lines.");
    assert(cover.querySelector('img[alt="Eruditio"]')?.getAttribute("src") === "/logos/eruditio.svg", "Use the existing Eruditio logo, not a PDF/image viewer.");
    assert(getComputedStyle(cover.querySelector("aside")!).backgroundColor === "rgb(243, 120, 13)", "The cover must use the reference orange side panel.");
    assert(getComputedStyle(cover.querySelector(".lw-cover-panel")!).backgroundColor === "rgb(236, 208, 166)", "The cover must use the reference beige title panel.");
    assert(cover.querySelector("aside")?.textContent === "LEARNER WORKBOOK", "Keep the source's workbook label.");
    assert(Array.from(cover.querySelectorAll(".lw-cover-meta b")).map(node => node.textContent).join("|") === "UNIT STANDARD 114046|NQF LEVEL: 5|CREDITS: 4|NOTIONAL HOURS: 40", "Preserve original unit metadata without inventing or substituting values.");
    for (const label of ["Name", "Surname", "ID Number", "Contact"]) {
      assert(cover.querySelector(`input[aria-label="${label}"]`), `Original learner field must be editable: ${label}.`);
    }
    for (let index = 1; index < pages.length; index++) {
      const copy = pages[index].cloneNode(true) as HTMLElement;
      copy.querySelectorAll(".document-signature").forEach(node => node.remove());
      copy.querySelectorAll(".source-document-field").forEach(node => {
        if (node.querySelector("span")?.textContent === "Learner response") node.remove();
      });
      assert(words(copy.textContent ?? "") === words(source.split("\f")[index]), `Source page ${index + 1} must retain every word in order.`);
    }
    assert(fixture.textContent?.includes("Write notes on the following"), "Use the uploaded assessment, not the hard-coded replacement questions.");
    assert(!fixture.textContent?.includes("Identify physical components of LAN."), "Do not silently replace uploaded questions with the old 114046 tasks.");
    assert(!fixture.querySelector("iframe,object,embed"), "The workbook must be actual HTML, not an embedded PDF.");
    const name = cover.querySelector<HTMLInputElement>('input[aria-label="Name"]')!;
    name.value = "Saved learner";
    name.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    const area = fixture.querySelector<HTMLTextAreaElement>(".source-workbook-answer textarea");
    assert(area, "Printed blank response lines must become a usable multiline HTML answer area.");
    area.value = "First answer line\nSecond answer line";
    area.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    assert(Object.keys(saved).some(key => key.startsWith("learner-workbook.practical.")), "Keep document-specific existing response keys.");
    flushSync(() => root.render(null));
    mount(documentModel);
    assert(fixture.querySelector<HTMLInputElement>('.lw-cover input[aria-label="Name"]')?.value === "Saved learner", "Cover answers must survive remount.");
    assert(fixture.querySelector<HTMLTextAreaElement>(".source-workbook-answer textarea")?.value.startsWith("First answer line\nSecond answer line"), "Grouped answers must reload from their original field keys.");
    assert(saved.unrelated === "Keep existing progress", "Do not overwrite unrelated saved progress.");

    let downloaded: Blob | undefined;
    const createUrl = URL.createObjectURL;
    const click = HTMLAnchorElement.prototype.click;
    try {
      URL.createObjectURL = blob => {
        if (blob instanceof Blob) downloaded = blob;
        return createUrl(blob);
      };
      HTMLAnchorElement.prototype.click = () => {};
      fixture.querySelector<HTMLButtonElement>(".document-action-html")!.click();
    } finally {
      URL.createObjectURL = createUrl;
      HTMLAnchorElement.prototype.click = click;
    }
    assert(downloaded, "HTML export must produce an editable document.");
    const exported = new DOMParser().parseFromString(await downloaded.text(), "text/html");
    assert(exported.querySelectorAll("[data-source-page]").length === 17, "Downloaded HTML must include every source page.");
    assert(exported.querySelector<HTMLInputElement>('.lw-cover input[aria-label="Name"]')?.getAttribute("value") === "Saved learner", "HTML export must retain field values.");
    assert(exported.querySelector("textarea") && !exported.querySelector(".document-actions"), "Keep editable controls in downloaded HTML, but exclude editing toolbars.");

    const originalPrint = window.print;
    let printed = false;
    try {
      window.print = () => {
        printed = true;
        assert(!fixture.querySelector(".document-print-target input,.document-print-target textarea"), "Print/PDF must render written values instead of interactive fields.");
        assert(fixture.querySelector(".document-print-target")?.textContent?.includes("Saved learner"), "Printed output must include saved answers.");
        window.dispatchEvent(new Event("afterprint"));
      };
      fixture.querySelector<HTMLButtonElement>(".document-action-pdf")!.click();
    } finally { window.print = originalPrint; }
    assert(printed && fixture.querySelector(".lw-cover input"), "Print/PDF must restore editable fields after printing.");
    if (matchMedia("print").matches) {
      assert(getComputedStyle(fixture.querySelector(".document-actions")!).display === "none", "Editing controls must be hidden in print.");
      assert(getComputedStyle(fixture.querySelector(".source-workbook-page")!).overflow === "visible", "Long source pages must not be clipped in print.");
    }
    assert(JSON.stringify(documentModel) === before, "Presentation must not rewrite the imported content or progress IDs.");

    const different = practicalTaskFromSource([
      "LEARNER WORKBOOK", "A DIFFERENT UNIT", "UNIT STANDARD 54321", "NQF LEVEL: 4", "CREDITS: 9",
      "LEARNER INFORMATION", "Name", "\f", "Custom question?", "Total: 10", "Total: 15",
    ].join("\n"), "other.pdf", "Different unit");
    mount(different, "editable-document.extra.");
    assert(fixture.querySelector(".lw-cover h1")?.textContent === "A DIFFERENT UNIT", "The cover cannot be hard-coded to the reference unit.");
    assert(!fixture.querySelector(".lw-cover-meta")?.textContent?.includes("40"), "Do not invent notional hours missing from the upload.");
    assert(fixture.textContent?.includes("Total: 10") && fixture.textContent.includes("Total: 15"), "Keep conflicting source totals unchanged.");
  } finally {
    flushSync(() => root.unmount());
    fixture.remove();
  }
  return "Passed actual 17-page workbook: reference cover, all source words/pages, editable learner and response fields, saved answers, HTML export and print/PDF restoration; other units retain their own content.";
}
