import type { ReactNode } from "react";
import { useEffect, useState } from "react";

/** In-app modal dialog — replaces browser popups so all prompts share the app UI. */
export function Modal({
  title,
  children,
  actions,
  onClose,
}: {
  title: string;
  children: ReactNode;
  actions: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title">{title}</div>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">{actions}</div>
      </div>
    </div>
  );
}

/** Confirmation dialog with app-styled buttons. */
export function ConfirmModal({
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      actions={
        <>
          <button className="btn ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`btn ${danger ? "danger" : "primary"}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      {message}
    </Modal>
  );
}

/** Text-input dialog (replaces window.prompt). */
export function PromptModal({
  title,
  message,
  placeholder,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onSubmit,
  onCancel,
}: {
  title: string;
  message?: ReactNode;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  return (
    <Modal
      title={title}
      onClose={onCancel}
      actions={
        <>
          <button className="btn ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="btn primary" onClick={() => onSubmit(value)}>
            {confirmLabel}
          </button>
        </>
      }
    >
      {message && <p style={{ margin: "0 0 10px" }}>{message}</p>}
      <div className="field" style={{ marginBottom: 0 }}>
        <input
          autoFocus
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit(value);
          }}
        />
      </div>
    </Modal>
  );
}

/** Notice dialog (replaces window.alert). */
export function AlertModal({
  title = "Notice",
  message,
  onClose,
}: {
  title?: string;
  message: ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      actions={
        <button className="btn primary" onClick={onClose}>
          OK
        </button>
      }
    >
      {message}
    </Modal>
  );
}
