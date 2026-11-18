import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "../icons";
import "./Select.css";

export type SelectOption = { value: string; label: string; hint?: string };

/**
 * Custom select with a fully styled option panel (native <select> popups
 * can't be themed). Supports keyboard navigation, type-ahead-free arrow
 * selection, click-outside close and listbox ARIA semantics.
 */
export function Select({
  value,
  options,
  onChange,
  className,
  ariaLabel,
  disabled = false,
  placeholder = "",
  buttonLabel,
  id,
  required = false,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
  placeholder?: string;
  buttonLabel?: string;
  id?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [invalid, setInvalid] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const revealActive = useRef(false);
  const listId = useId();

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Pointer hover must never fight wheel/touch scrolling. Only opening and
    // keyboard navigation reveal an option, without scrolling the page/modal.
    if (!revealActive.current) return;
    revealActive.current = false;
    const panel = panelRef.current;
    const option = panel?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    if (!panel || !option) return;
    const bounds = panel.getBoundingClientRect();
    const item = option.getBoundingClientRect();
    const top = bounds.top + panel.clientTop;
    const bottom = top + panel.clientHeight;
    if (item.top < top) panel.scrollTop -= top - item.top;
    else if (item.bottom > bottom) panel.scrollTop += item.bottom - bottom;
  }, [open, active]);

  const openPanel = () => {
    revealActive.current = true;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const pick = (v: string) => {
    setInvalid(false);
    onChange(v);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openPanel();
      }
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) revealActive.current = true;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (options[active]) pick(options[active].value);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className={`nice-select${className ? ` ${className}` : ""}`} ref={rootRef}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        className={`nice-select-btn${open ? " open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${listId}-error` : undefined}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={onKeyDown}
      >
        <span className="nice-select-value">{buttonLabel ?? selected?.label ?? placeholder}</span>
        <span className="nice-select-chev" aria-hidden="true">
          <Icon name="chevronDown" size={14} />
        </span>
      </button>
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          value={value}
          required
          disabled={disabled}
          onChange={() => {}}
          onInvalid={(event) => {
            event.preventDefault();
            setInvalid(true);
            rootRef.current?.querySelector<HTMLButtonElement>(".nice-select-btn")?.focus();
          }}
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none", padding: 0, border: 0 }}
        />
      )}
      {invalid && <span id={`${listId}-error`} role="alert">Please select an option.</span>}
      {open && !disabled && (
        <div className="nice-select-panel" role="listbox" id={listId} ref={panelRef}>
          {options.map((o, i) => (
            <div
              key={o.value}
              data-idx={i}
              role="option"
              aria-selected={o.value === value}
              className={`nice-select-opt${o.value === value ? " selected" : ""}${
                i === active ? " active" : ""
              }`}
              onPointerMove={() => { revealActive.current = false; setActive(i); }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(o.value)}
            >
              <span className="nice-select-opt-label">
                {o.label}
                {o.hint && <span className="nice-select-opt-hint">{o.hint}</span>}
              </span>
              {o.value === value && (
                <span className="nice-select-tick" aria-hidden="true">
                  <Icon name="check" size={13} />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
