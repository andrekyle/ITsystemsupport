import React, { useEffect, useRef } from "react";
import { Icon } from "../icons";

/** Plain-text cell that can be edited in place. Click to edit; saves on blur (Enter also saves, Escape cancels). */
export function InlineText({
  value,
  editable,
  onSave,
  as: Tag = "span",
  className,
  placeholder,
  multiline = false,
}: {
  value: string;
  editable: boolean;
  onSave: (text: string) => void;
  as?: "span" | "div" | "p" | "strong";
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) el.textContent = value;
  }, [value]);
  if (!editable) return <Tag className={className}>{value}</Tag>;
  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`plan-edit${className ? ` ${className}` : ""}`}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      data-placeholder={placeholder}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const text = (e.currentTarget.textContent ?? "").replace(/\u00a0/g, " ").trim();
        if (text !== value) onSave(text);
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter" && !multiline && !e.shiftKey) {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
        if (e.key === "Escape") {
          e.currentTarget.textContent = value;
          (e.currentTarget as HTMLElement).blur();
        }
      }}
    >
      {value}
    </Tag>
  );
}

/** Small square icon button used for add / move / delete controls in editable tables. */
export function InlineIconBtn({ title, icon, onClick, danger }: { title: string; icon: React.ComponentProps<typeof Icon>["name"]; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" className={`plan-ctl${danger ? " danger" : ""}`} title={title} aria-label={title} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <Icon name={icon} size={13} />
    </button>
  );
}
