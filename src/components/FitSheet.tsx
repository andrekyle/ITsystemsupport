import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/** Scales a fixed-width paper sheet down to fit the screen, PDF-style, keeping
 *  it horizontally centred. Print output is unaffected — @media print resets
 *  the transform. */
export function FitSheet({ width, children }: { width: number; children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [fit, setFit] = useState<{ scale: number; height?: number }>({ scale: 1 });
  useEffect(() => {
    const measure = () => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;
      const scale = Math.min(1, outer.clientWidth / width);
      setFit({ scale, height: scale < 1 ? inner.offsetHeight * scale : undefined });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outerRef.current) ro.observe(outerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [width]);
  const scaled = fit.scale < 1;
  return (
    <div ref={outerRef} className="sheet-fit">
      {/* mid layer is exactly the sheet's visual size, so margin:auto centres it */}
      <div
        className="sheet-fit-mid"
        style={scaled ? { width: Math.floor(width * fit.scale), height: fit.height } : undefined}
      >
        <div
          ref={innerRef}
          className="sheet-fit-inner"
          style={{ width, transform: scaled ? `scale(${fit.scale})` : undefined }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
