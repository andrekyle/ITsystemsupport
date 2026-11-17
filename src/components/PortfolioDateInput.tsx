const datePattern = /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi;

function isoDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

/** Keep existing narrative records intact while offering native calendar controls. */
export function PortfolioDateInput({ label, value, disabled, onChange }: {
  label: string; value: string; disabled: boolean; onChange: (value: string) => void;
}) {
  const matches = [...value.matchAll(datePattern)];
  const range = /start.*end|dates\b/i.test(label);
  const mixed = /signature|assessor|acknowledgement|reference|location|hours|result|confirmation|description/i.test(label)
    || !!value.trim() && (!matches.length || value.replace(datePattern, "").replace(/[\s\-–—/]+/g, "").length > 0);
  function changeDate(index: number, next: string) {
    const match = matches[index];
    if (match) onChange(value.slice(0, match.index!) + next + value.slice(match.index! + match[0].length));
    else if (!range && !mixed) onChange(next);
    else if (next) onChange([value, next].filter(Boolean).join(range && matches.length ? " - " : " | "));
  }
  return <div className="portfolio-date-input">
    {mixed && <input type="text" aria-label={`${label} details`} value={value} disabled={disabled} onChange={event => onChange(event.target.value)} />}
    <div className="portfolio-date-pickers">
      <input type="date" aria-label={range ? `${label} start date` : label} value={matches[0] ? isoDate(matches[0][0]) : ""} disabled={disabled} onChange={event => changeDate(0, event.target.value)} />
      {range && <><span>to</span><input type="date" aria-label={`${label} end date`} value={matches[1] ? isoDate(matches[1][0]) : ""} disabled={disabled || !matches[0]} min={matches[0] ? isoDate(matches[0][0]) : undefined} onChange={event => changeDate(1, event.target.value)} /></>}
    </div>
  </div>;
}
