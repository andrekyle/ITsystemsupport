import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "../icons";
import { Select } from "./Select";

const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const HOURS = Array.from({ length: 24 }, (_, h) => ({ value: pad(h), label: pad(h) }));
const MINUTES = Array.from({ length: 12 }, (_, i) => ({ value: pad(i * 5), label: pad(i * 5) }));
const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/**
 * Themed stand-in for <input type="datetime-local">. The native popup can't
 * be styled (its highlights follow the OS), so this draws the calendar and
 * time in the app's own colours. Value is the same local
 * "YYYY-MM-DDTHH:mm" string the native input produces.
 */
export function DateTimePicker({
  id,
  value,
  min,
  onChange,
  placeholder = "Not set",
}: {
  id?: string;
  value: string;
  /** earliest allowed moment, "YYYY-MM-DDTHH:mm" — earlier days are greyed out */
  min?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const day = value.slice(0, 10);
  const time = value.slice(11, 16);
  // remembers the chosen time while no day has been picked yet
  const [stagedTime, setStagedTime] = useState(time || "09:00");
  const [hh, mm] = (time || stagedTime).split(":");

  const today = isoDay(new Date());
  const minDay = min ? min.slice(0, 10) : "";
  const firstAllowedDay = minDay > today ? minDay : today;

  const [view, setView] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const openPanel = () => {
    const d = value ? new Date(value) : new Date();
    setView({ y: d.getFullYear(), m: d.getMonth() });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // six Monday-first weeks around the month on display
  const cells = useMemo(() => {
    const lead = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => new Date(view.y, view.m, 1 - lead + i));
  }, [view]);

  const shiftMonth = (by: number) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + by, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const pickDay = (iso: string) => onChange(`${iso}T${hh}:${mm}`);

  const pickTime = (h: string, m: string) => {
    setStagedTime(`${h}:${m}`);
    onChange(`${day || firstAllowedDay}T${h}:${m}`);
  };

  // same shape as the header's session clock: locale date + 24h time
  const label = value
    ? `${new Date(value).toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })}, ${hh}:${mm}`
    : placeholder;

  return (
    <div className="dtp" ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`dtp-btn${open ? " open" : ""}${value ? "" : " empty"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => (open ? setOpen(false) : openPanel())}
      >
        <span className="dtp-ico" aria-hidden="true">
          <Icon name="calendar" size={17} />
        </span>
        <span className="dtp-value">{label}</span>
      </button>
      {value && (
        <button
          type="button"
          className="dtp-clear"
          aria-label="Clear date and time"
          onClick={() => onChange("")}
        >
          <Icon name="close" size={14} />
        </button>
      )}

      {open && (
        <div className="dtp-panel" role="dialog" id={panelId} aria-label="Choose a date and time">
          <div className="dtp-head">
            <button
              type="button"
              className="dtp-nav"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
            >
              <Icon name="chevronLeft" size={16} />
            </button>
            <span className="dtp-month">
              {new Date(view.y, view.m, 1).toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              type="button"
              className="dtp-nav"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
            >
              <Icon name="chevronRight" size={16} />
            </button>
          </div>

          <div className="dtp-grid">
            {DOW.map((d) => (
              <span key={d} className="dtp-dow" aria-hidden="true">
                {d}
              </span>
            ))}
            {cells.map((d) => {
              const iso = isoDay(d);
              const cls = [
                "dtp-day",
                d.getMonth() !== view.m ? "outside" : "",
                iso === today ? "today" : "",
                iso === day ? "selected" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={iso}
                  type="button"
                  className={cls}
                  disabled={!!minDay && iso < minDay}
                  aria-pressed={iso === day}
                  aria-label={d.toLocaleDateString(undefined, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  onClick={() => pickDay(iso)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="dtp-time">
            <span className="dtp-time-label">
              <Icon name="clock" size={15} />
              Time
            </span>
            <Select
              className="dtp-select"
              ariaLabel="Hour"
              value={hh}
              options={HOURS}
              onChange={(h) => pickTime(h, mm)}
            />
            <span className="dtp-colon" aria-hidden="true">
              :
            </span>
            <Select
              className="dtp-select"
              ariaLabel="Minutes"
              value={mm}
              options={MINUTES}
              onChange={(m) => pickTime(hh, m)}
            />
          </div>

          <div className="dtp-foot">
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn ghost sm"
              disabled={!!minDay && today < minDay}
              onClick={() => {
                setView({ y: new Date().getFullYear(), m: new Date().getMonth() });
                pickDay(today);
              }}
            >
              Today
            </button>
            <button type="button" className="btn primary sm" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
