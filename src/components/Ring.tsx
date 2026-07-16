export function Ring({
  value,
  size = 26,
  stroke = 3,
  showLabel = false,
  label,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  showLabel?: boolean;
  /** custom centre text (defaults to percentage when showLabel is set) */
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, Math.max(0, value)));
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size }}>
      <svg width={size} height={size} className={`ring${value >= 1 ? " done" : ""}`}>
        <circle className="track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className="val"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
        />
      </svg>
      {(showLabel || label) && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: label ? size / 5.6 : size / 4.4,
            fontWeight: 600,
            color: "var(--ink-2)",
          }}
        >
          {label ?? `${Math.round(value * 100)}%`}
        </span>
      )}
    </span>
  );
}

export function Bar({ value, green = false }: { value: number; green?: boolean }) {
  return (
    <span className={`bar${green ? " green" : ""}`} style={{ display: "block" }}>
      <span style={{ width: `${Math.round(value * 100)}%` }} />
    </span>
  );
}
