import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../icons";
import { InlineEditingTools } from "./EditingSidebar";

export function UnitEditingDialog({ open, title, onClose, children }: {
  open: boolean;
  title: string;
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
        <h2>Edit unit · {title}</h2>
        <button type="button" className="btn ghost" aria-label="Close unit editor" onClick={onClose}>
          <Icon name="close" size={20} />
        </button>
      </header>
      <div className="unit-edit-dialog-body">
        <InlineEditingTools>{children}</InlineEditingTools>
      </div>
    </dialog>,
    document.body
  );
}
