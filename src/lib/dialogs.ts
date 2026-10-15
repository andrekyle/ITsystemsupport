/** Also embedded in standalone reports, so this function must be self-contained. */
export function showAppDialog(message: string, confirmation = false): Promise<boolean> {
  return new Promise((resolve) => {
    const previousFocus = document.activeElement;
    const dialog = document.createElement("dialog");
    dialog.contentEditable = "false";
    dialog.setAttribute("aria-label", confirmation ? "Confirm action" : "Notice");
    dialog.style.cssText = "position:fixed;inset:0;margin:auto;width:min(420px,calc(100vw - 32px));box-sizing:border-box;padding:24px;border:0;border-radius:20px;background:#2c2c2c;color:#eee;box-shadow:0 16px 60px #0008;font:14px/1.5 'Segoe UI',Arial,sans-serif;";
    const text = document.createElement("p");
    text.textContent = message;
    text.style.cssText = "margin:0 0 24px;white-space:pre-wrap";
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;justify-content:flex-end;gap:8px";
    function button(label: string, value: string) {
      const element = document.createElement("button");
      element.type = "button";
      element.textContent = label;
      element.style.cssText = "padding:9px 18px;border:0;border-radius:24px;background:#3c3c3c;color:#fff;font:inherit;cursor:pointer";
      element.onclick = () => dialog.close(value);
      actions.append(element);
      return element;
    }
    if (confirmation) button("Cancel", "cancel");
    const accept = button(confirmation ? "Confirm" : "OK", "accept");
    dialog.append(text, actions);
    dialog.addEventListener("close", () => {
      const accepted = dialog.returnValue === "accept";
      dialog.remove();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
      resolve(accepted);
    }, { once: true });
    document.body.append(dialog);
    dialog.showModal();
    (confirmation ? actions.firstElementChild as HTMLButtonElement : accept).focus();
  });
}

export const REPORT_DIALOG_SCRIPT = `<script data-report-dialog>var showAppDialog = ${showAppDialog.toString()};</script>`;
