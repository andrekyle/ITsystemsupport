import type { ReactNode } from "react";

export function WorkbookCover({ title, metadata, children, number, sourcePage = false, label = "LEARNER WORKBOOK", className = "" }: {
  title: string;
  metadata: string[];
  children?: ReactNode;
  number?: number;
  sourcePage?: boolean;
  label?: string;
  className?: string;
}) {
  return <section className={`lw-page lw-cover ${className}`} data-page={number} data-source-page={sourcePage ? number : undefined}>
    <div className="lw-cover-main">
      <img src="/logos/eruditio.svg" alt="Eruditio" />
      <div className="lw-cover-panel">
        <h1>{title}</h1>
        <div className="lw-cover-meta">{metadata.map((text, index) => <b key={index}>{text}</b>)}</div>
        {children}
      </div>
    </div>
    <aside>{label}</aside>
  </section>;
}
