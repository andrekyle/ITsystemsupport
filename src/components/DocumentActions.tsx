import { useState } from "react";
import { Icon } from "../icons";
import { EditingTools } from "./EditingSidebar";

export function DocumentActions({ name, labelled = false, onSave, editing = false }: { name: string; labelled?: boolean; onSave?: () => Promise<void>; editing?: boolean }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const save = async () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      // Allow blur handlers to commit their field before taking the snapshot.
      await new Promise<void>(resolve => window.setTimeout(resolve, 0));
      await onSave?.();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : `${name} could not be saved.`);
    } finally {
      setSaving(false);
    }
  };

  const downloadHtml = () => {
    const source = document.querySelector<HTMLElement>(".document-print-target");
    if (!source) return;
    const clone = source.cloneNode(true) as HTMLElement;
    const sourceFields = source.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input,textarea,select");
    const cloneFields = clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input,textarea,select");
    sourceFields.forEach((field, index) => {
      const copy = cloneFields[index];
      if (!copy) return;
      if (field instanceof HTMLInputElement && copy instanceof HTMLInputElement) {
        copy.setAttribute("value", field.value);
        if (field.checked) copy.setAttribute("checked", "checked"); else copy.removeAttribute("checked");
      } else if (field instanceof HTMLTextAreaElement && copy instanceof HTMLTextAreaElement) {
        copy.textContent = field.value;
      } else if (field instanceof HTMLSelectElement && copy instanceof HTMLSelectElement) {
        Array.from(copy.options).forEach((option, optionIndex) => option.toggleAttribute("selected", field.options[optionIndex]?.selected ?? false));
      }
    });
    clone.querySelectorAll<HTMLButtonElement>(".replica-field button[role=checkbox],.replica-field button[role=radio]").forEach(button => {
      const input = document.createElement("input");
      input.type = button.getAttribute("role") === "radio" ? "radio" : "checkbox";
      if (input.type === "radio") input.name = `pdf-choice-${button.dataset.fieldId}`;
      input.className = `${button.className.replace(/\bon\b/g, "")} replica-export-choice`;
      input.setAttribute("aria-label", button.getAttribute("aria-label") ?? "Select");
      if (button.getAttribute("aria-checked") === "true") input.setAttribute("checked", "checked");
      button.replaceWith(input);
    });
    clone.querySelectorAll<HTMLTextAreaElement>(".lw-lines textarea,.workbook-task-response textarea").forEach(field => {
      const printValue = document.createElement("span");
      printValue.className = "document-print-value";
      printValue.textContent = field.value;
      field.replaceWith(printValue);
    });
    clone.querySelectorAll(".no-print,.document-signature-actions,.document-signature-file").forEach(node => node.remove());
    clone.querySelectorAll<HTMLImageElement>("img").forEach(image => {
      const src = image.getAttribute("src");
      if (src && !src.startsWith("data:")) image.src = new URL(src, location.href).href;
    });
    const css = Array.from(document.styleSheets).map(sheet => {
      try { return Array.from(sheet.cssRules).map(rule => rule.cssText).join("\n"); } catch { return ""; }
    }).join("\n");
    const title = name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const replicaScript = clone.querySelector(".replica-comb") ? `<script>document.querySelectorAll(".replica-comb").forEach(function(box){var input=box.querySelector("input");if(!input)return;var cells=box.querySelectorAll(".replica-comb-cell");input.addEventListener("input",function(){cells.forEach(function(cell,index){cell.textContent=input.value[index]||"";cell.classList.remove("caret","selected","caret-end")})})});</script>` : "";
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><style>${css}\nbody{margin:0;padding:24px;background:#fff}.document-print-target{margin:0 auto!important}.document-signature-actions{display:none!important}</style></head><body class="document-export">${clone.outerHTML}${replicaScript}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.html`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadPdf = () => {
    const target = document.querySelector<HTMLElement>(".document-print-target");
    if (!target) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    const replacements: Array<{ field: Element; printValue: HTMLElement }> = [];
    target.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input:not([type=file]),textarea,select").forEach(field => {
      if (field.classList.contains("replica-comb-input")) return;
      const printValue = document.createElement("span");
      printValue.className = "document-print-value";
      if (field.closest(".replica-field")) {
        if (field.classList.contains("replica-textarea")) printValue.classList.add("replica-textarea-value");
        if (field.classList.contains("paper-signature")) printValue.classList.add("paper-signature");
      }
      if (field instanceof HTMLInputElement && field.type === "checkbox") {
        printValue.classList.add("is-checkbox");
        printValue.textContent = field.checked ? "✓" : "";
      } else if (field instanceof HTMLSelectElement) {
        printValue.textContent = field.selectedOptions[0]?.text ?? "";
      } else {
        printValue.textContent = field.value;
      }
      field.replaceWith(printValue);
      replacements.push({ field, printValue });
    });
    const restore = () => replacements.forEach(({ field, printValue }) => printValue.replaceWith(field));
    window.addEventListener("afterprint", restore, { once: true });
    window.print();
    // Browsers normally fire afterprint; this fallback also covers cancelled
    // dialogs and embedded webviews that omit the event.
    window.setTimeout(() => {
      replacements.forEach(({ field, printValue }) => { if (printValue.isConnected) printValue.replaceWith(field); });
    }, 1000);
  };

  const tools = (
    <div className={`document-actions no-print${labelled ? " is-labelled" : ""}`} role="toolbar" aria-label={`${name} actions`}>
      <button type="button" className={saved ? "is-saved" : ""} disabled={saving} onClick={() => void save()} title={saved ? "Saved" : `Save ${name}`} aria-label={`Save ${name}`}>
        <Icon name="save" size={18} />
        {labelled && <span>{saving ? "Saving…" : saved ? "Saved" : "Save"}</span>}
      </button>
      <button type="button" className="document-action-pdf" onClick={downloadPdf} title={`Download ${name} as PDF`} aria-label={`Download ${name} as PDF`}>
        <Icon name="download" size={18} />
        {labelled && <span>PDF</span>}
      </button>
      <button type="button" className="document-action-html" onClick={downloadHtml} title={`Download ${name} as HTML`} aria-label={`Download ${name} as HTML`}>
        <Icon name="document" size={18} />
        {labelled && <span>HTML</span>}
      </button>
      {saved && !labelled && <span role="status">Saved</span>}
      {saveError && <span className="auth-error" role="alert">{saveError}</span>}
    </div>
  );
  return editing ? <EditingTools active title={`${name} actions`}>{tools}</EditingTools> : tools;
}
