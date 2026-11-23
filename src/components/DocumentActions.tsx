import { Icon } from "../icons";
import { EditingTools } from "./EditingSidebar";

export function DocumentActions({ name, labelled = false, editing = false }: { name: string; labelled?: boolean; onSave?: () => Promise<void>; editing?: boolean }) {
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
    // FitSheet carries measurements from the app viewport as inline styles.
    // They are invalid once the standalone file opens in another window and
    // can combine with A4 export rules to crop the right side of every page.
    clone.querySelectorAll<HTMLElement>(".sheet-fit,.sheet-fit-mid,.sheet-fit-inner").forEach(element=>element.removeAttribute("style"));
    const css = Array.from(document.styleSheets).map(sheet => {
      try { return Array.from(sheet.cssRules).map(rule => rule.cssText).join("\n"); } catch { return ""; }
    }).join("\n");
    const title = name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const replicaScript = clone.querySelector(".replica-comb") ? `<script>document.querySelectorAll(".replica-comb").forEach(function(box){var input=box.querySelector("input");if(!input)return;var cells=box.querySelectorAll(".replica-comb-cell");input.addEventListener("input",function(){cells.forEach(function(cell,index){cell.textContent=input.value[index]||"";cell.classList.remove("caret","selected","caret-end")})})});</script>` : "";
    const fitScript = clone.querySelector(".sheet-fit") ? `<script>(function(){function fit(){document.querySelectorAll(".sheet-fit").forEach(function(outer){var mid=outer.querySelector(":scope > .sheet-fit-mid"),inner=mid&&mid.querySelector(":scope > .sheet-fit-inner"),page=inner&&inner.firstElementChild;if(!mid||!inner||!page)return;var width=parseFloat(page.style.width)||page.getBoundingClientRect().width||1000;var available=Math.max(280,Math.min(width,document.documentElement.clientWidth-16));var scale=Math.min(1,available/width);inner.style.width=width+"px";inner.style.transform=scale<1?"scale("+scale+")":"none";mid.style.width=Math.floor(width*scale)+"px";mid.style.height=Math.ceil(inner.scrollHeight*scale)+"px"})}addEventListener("resize",fit);if(document.readyState==="loading")addEventListener("DOMContentLoaded",fit);else fit()})();</script>` : "";
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${css}\nhtml,body{max-width:100%;overflow-x:hidden}body{margin:0;padding:0 8px;background:#fff;box-sizing:border-box}.document-print-target{box-sizing:border-box!important;width:100%!important;max-width:210mm!important;margin:0 auto!important}.document-print-target .lw-page{box-sizing:border-box!important;width:210mm!important;padding:58px 62px!important;border:0!important;outline:0!important}.document-print-target table{box-sizing:border-box!important;display:table!important;width:100%!important;min-width:100%!important;max-width:100%!important;margin-left:0!important;margin-right:0!important;table-layout:fixed!important}.document-signature-actions,.document-signature-use-saved{display:none!important}@media print{body{padding:0}.document-print-target{width:210mm!important;max-width:none!important}.sheet-fit,.sheet-fit-mid{width:auto!important;height:auto!important;overflow:visible!important}.sheet-fit-inner{width:auto!important;transform:none!important}}</style></head><body class="document-export">${clone.outerHTML}${replicaScript}${fitScript}</body></html>`;
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
      {/workbook/i.test(name) && <button type="button" title="Back to workbook top" aria-label="Back to workbook top" onClick={() => document.querySelector('.document-print-target')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9" /></svg></button>}
      <button type="button" className="document-action-pdf" onClick={downloadPdf} title={`Download ${name} as PDF`} aria-label={`Download ${name} as PDF`}>
        <Icon name="download" size={18} />
        {labelled && <span>PDF</span>}
      </button>
      <button type="button" className="document-action-html" onClick={downloadHtml} title={`Download ${name} as HTML`} aria-label={`Download ${name} as HTML`}>
        <Icon name="document" size={18} />
        {labelled && <span>HTML</span>}
      </button>
    </div>
  );
  return editing ? <EditingTools active title={`${name} actions`}>{tools}</EditingTools> : tools;
}
