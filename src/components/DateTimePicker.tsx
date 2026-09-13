import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../icons";
import { Select } from "./Select";

const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const HOURS = Array.from({ length: 24 }, (_, h) => ({ value: pad(h), label: pad(h) }));
const MINUTES = Array.from({ length: 12 }, (_, i) => ({ value: pad(i * 5), label: pad(i * 5) }));
const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const PANEL_W = 308;
const GAP = 6;
const EDGE = 8;
const YEARS_PER_PAGE = 20;

const MONTHS = Array.from({ length: 12 }, (_, m) =>
  new Date(2000, m, 1).toLocaleDateString(undefined, { month: "short" })
);

/**
 * Themed stand-in for <input type="datetime-local"> (and, with withTime
 * off, <input type="date">). The native popups can't be styled — their
 * highlights follow the OS — so this draws the calendar and time in the
 * app's own colours. Every calendar on the platform uses this component.
 * Value is the same local "YYYY-MM-DDTHH:mm" / "YYYY-MM-DD" string the
 * native inputs produce.
 */
export function DateTimePicker({
  id,
  value,
  min,
  max,
  onChange,
  placeholder = "Not set",
  withTime = true,
  clearable = true,
  className,
  ariaLabel,
}: {
  id?: string;
  value: string;
  /** earliest allowed moment — earlier days are greyed out */
  min?: string;
  max?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** false = date only ("YYYY-MM-DD"), no time row */
  withTime?: boolean;
  /** false = a value is required, so no clear × or Clear button */
  clearable?: boolean;
  /** "bare" drops the field chrome for use inside document cells */
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const day = value.slice(0, 10);
  const time = withTime ? value.slice(11, 16) : "";
  // remembers the chosen time while no day has been picked yet
  const [stagedTime, setStagedTime] = useState(time || "09:00");
  const [hh, mm] = (time || stagedTime).split(":");

  const today = isoDay(new Date());
  const minDay = min ? min.slice(0, 10) : "";
  const maxDay = max ? max.slice(0, 10) : "";
  const firstAllowedDay = minDay > today ? minDay : maxDay && maxDay < today ? maxDay : today;

  const [view, setView] = useState(() => {
    const d = new Date(value || `${firstAllowedDay}T00:00:00`);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  // days → (tap the title) months of a year → (tap the year) 20-year page
  const [mode, setMode] = useState<"days" | "months" | "years">("days");

  // The panel is portalled to <body> and fixed-positioned from the field's
  // screen rect: sheets like the registration form sit in a scaled,
  // overflow-hidden wrapper that would otherwise clip it.
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const openPanel = () => {
    const d = new Date(value || `${firstAllowedDay}T00:00:00`);
    setView({ y: d.getFullYear(), m: d.getMonth() });
    setMode("days");
    setPos(null);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    btnRef.current?.focus({ preventScroll: true });
  };

  const place = () => {
    const field = rootRef.current?.getBoundingClientRect();
    const panelH = panelRef.current?.offsetHeight ?? 0;
    if (!field) return;
    const roomBelow = window.innerHeight - field.bottom - GAP - EDGE;
    const roomAbove = field.top - GAP - EDGE;
    let top = field.bottom + GAP;
    if (panelH > roomBelow && roomAbove > roomBelow) top = field.top - GAP - panelH;
    top = Math.max(EDGE, Math.min(top, window.innerHeight - panelH - EDGE));
    const left = Math.max(EDGE, Math.min(field.left, window.innerWidth - PANEL_W - EDGE));
    setPos({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    // follow the field while the page scrolls or the window resizes
    window.addEventListener("scroll", place, { capture: true, passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, { capture: true });
      window.removeEventListener("resize", place);
    };
  }, [open, withTime, mode]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
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

  const shiftYear = (by: number) => setView(({ y, m }) => ({ y: y + by, m }));

  const yearPageStart = Math.floor(view.y / YEARS_PER_PAGE) * YEARS_PER_PAGE;
  const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPageStart + i);

  const minYear = minDay ? Number(minDay.slice(0, 4)) : -Infinity;
  const minMonth = minDay ? Number(minDay.slice(5, 7)) - 1 : -1;
  const maxYear = maxDay ? Number(maxDay.slice(0, 4)) : Infinity;
  const maxMonth = maxDay ? Number(maxDay.slice(5, 7)) - 1 : 12;
  const todayYear = Number(today.slice(0, 4));
  const todayMonth = Number(today.slice(5, 7)) - 1;
  const dayYear = day ? Number(day.slice(0, 4)) : NaN;
  const dayMonth = day ? Number(day.slice(5, 7)) - 1 : NaN;

  const headerTitle =
    mode === "days"
      ? new Date(view.y, view.m, 1).toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        })
      : mode === "months"
        ? String(view.y)
        : `${yearPageStart} – ${yearPageStart + YEARS_PER_PAGE - 1}`;

  const stepBack = () =>
    mode === "days" ? shiftMonth(-1) : shiftYear(mode === "months" ? -1 : -YEARS_PER_PAGE);
  const stepForward = () =>
    mode === "days" ? shiftMonth(1) : shiftYear(mode === "months" ? 1 : YEARS_PER_PAGE);
  const stepLabel = mode === "days" ? "month" : mode === "months" ? "year" : `${YEARS_PER_PAGE} years`;

  // date-only pickers have nothing left to choose once a day is tapped
  const pickDay = (iso: string) => {
    if ((minDay && iso < minDay) || (maxDay && iso > maxDay)) return;
    onChange(withTime ? `${iso}T${hh}:${mm}` : iso);
    if (!withTime) close();
  };

  const pickTime = (h: string, m: string) => {
    setStagedTime(`${h}:${m}`);
    onChange(`${day || firstAllowedDay}T${h}:${m}`);
  };

  // same shape as the header's session clock: locale date (+ 24h time)
  const label = !value
    ? placeholder
    : withTime
      ? `${new Date(value).toLocaleDateString(undefined, {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })}, ${hh}:${mm}`
      : new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

  return (
    <div className={`dtp${withTime ? "" : " date-only"}${className ? ` ${className}` : ""}`} ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        id={id}
        className={`dtp-btn${open ? " open" : ""}${value ? "" : " empty"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openPanel())}
      >
        <span className="dtp-ico" aria-hidden="true">
          <Icon name="calendar" size={17} />
        </span>
        <span className="dtp-value">{label}</span>
      </button>
      {value && clearable && (
        <button
          type="button"
          className="dtp-clear"
          aria-label={withTime ? "Clear date and time" : "Clear date"}
          onClick={() => onChange("")}
        >
          <Icon name="close" size={14} />
        </button>
      )}

      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="dtp-panel"
            role="dialog"
            id={panelId}
            aria-label="Choose a date and time"
            // stays invisible for the first paint until place() has measured it
            style={pos ? { top: pos.top, left: pos.left } : { visibility: "hidden" }}
          >
            <div className="dtp-head">
              <button
                type="button"
                className="dtp-nav"
                aria-label={`Previous ${stepLabel}`}
                onClick={stepBack}
              >
                <Icon name="chevronLeft" size={16} />
              </button>
              {mode === "years" ? (
                <span className="dtp-month">{headerTitle}</span>
              ) : (
                <button
                  type="button"
                  className="dtp-month dtp-month-btn"
                  aria-label={mode === "days" ? "Choose a month" : "Choose a year"}
                  onClick={() => setMode(mode === "days" ? "months" : "years")}
                >
                  {headerTitle}
                  <Icon name="chevronDown" size={13} />
                </button>
              )}
              <button
                type="button"
                className="dtp-nav"
                aria-label={`Next ${stepLabel}`}
                onClick={stepForward}
              >
                <Icon name="chevronRight" size={16} />
              </button>
            </div>

            {mode === "days" && (
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
                      disabled={(!!minDay && iso < minDay) || (!!maxDay && iso > maxDay)}
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
            )}

            {mode === "months" && (
              <div className="dtp-grid months">
                {MONTHS.map((name, m) => {
                  const cls = [
                    "dtp-day",
                    view.y === todayYear && m === todayMonth ? "today" : "",
                    view.y === dayYear && m === dayMonth ? "selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <button
                      key={name}
                      type="button"
                      className={cls}
                      disabled={view.y < minYear || (view.y === minYear && m < minMonth) || view.y > maxYear || (view.y === maxYear && m > maxMonth)}
                      aria-pressed={view.y === dayYear && m === dayMonth}
                      aria-label={new Date(view.y, m, 1).toLocaleDateString(undefined, {
                        month: "long",
                        year: "numeric",
                      })}
                      onClick={() => {
                        setView({ y: view.y, m });
                        setMode("days");
                      }}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            )}

            {mode === "years" && (
              <div className="dtp-grid years">
                {years.map((y) => {
                  const cls = [
                    "dtp-day",
                    y === todayYear ? "today" : "",
                    y === dayYear ? "selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <button
                      key={y}
                      type="button"
                      className={cls}
                      disabled={y < minYear || y > maxYear}
                      aria-pressed={y === dayYear}
                      onClick={() => {
                        setView({ y, m: view.m });
                        setMode("months");
                      }}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}

            {withTime && (
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
            )}

            <div className="dtp-foot">
              {clearable && (
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => {
                    onChange("");
                    close();
                  }}
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                className="btn ghost sm"
                disabled={(!!minDay && today < minDay) || (!!maxDay && today > maxDay)}
                onClick={() => {
                  setView({ y: new Date().getFullYear(), m: new Date().getMonth() });
                  setMode("days");
                  pickDay(today);
                }}
              >
                Today
              </button>
              <button type="button" className="btn primary sm" onClick={close}>
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
