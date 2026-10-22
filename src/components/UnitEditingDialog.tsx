import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../icons";
import { InlineEditingTools } from "./EditingSidebar";

export function UnitEditingDialog({ open, title, subtitle, onClose, children }: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);
  return createPortal(
    <dialog ref={ref} className="unit-edit-dialog" aria-label={`Edit unit: ${title}`}
      onCancel={event => { event.preventDefault(); onClose(); }}>
      <header className="unit-edit-dialog-header">
        <div className="unit-edit-dialog-heading">
          <span className="unit-edit-dialog-eyebrow"><Icon name="pencil" size={13} />Unit editor{subtitle ? ` · ${subtitle}` : ""}</span>
          <h2>{title}</h2>
        </div>
        <button type="button" className="unit-edit-dialog-close" aria-label="Close unit editor" onClick={onClose}>
          <Icon name="close" size={16} /><span>Close</span>
        </button>
      </header>
      <div className="unit-edit-dialog-body">
        <InlineEditingTools>{children}</InlineEditingTools>
      </div>
    </dialog>,
    document.body
  );
}
