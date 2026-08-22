import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "../icons";

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
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
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
    // keep the active option visible while arrowing through the list
    panelRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const openPanel = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const pick = (v: string) => {
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
        type="button"
        className={`nice-select-btn${open ? " open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={onKeyDown}
      >
        <span className="nice-select-value">{selected?.label ?? ""}</span>
        <span className="nice-select-chev" aria-hidden="true">
          <Icon name="chevronDown" size={14} />
        </span>
      </button>
      {open && (
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
              onPointerMove={() => setActive(i)}
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
