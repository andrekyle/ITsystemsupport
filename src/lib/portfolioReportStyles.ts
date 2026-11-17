export const portfolioReportStyles = `
:root { color-scheme: light; font-family: "Segoe UI", Arial, sans-serif; color: #292826; background: #f3f1ed; }
* { box-sizing: border-box; }
body { margin: 0; font-size: 13px; line-height: 1.6; }
.report { max-width: 1180px; margin: 32px auto; background: #fff; box-shadow: 0 8px 40px #29282612; }
.cover { padding: 48px 48px 36px; border-top: 7px solid #eb5720; background-image: linear-gradient(90deg, #eb5720 0 40%, #278c6d 40% 70%, #fdcb29 70% 88%, #dcbda0 88%); background-size: 100% 4px; background-repeat: no-repeat; background-position: bottom; border-bottom: 1px solid #ded8d0; }
.eyebrow { margin: 0 0 18px; color: #278c6d; font-size: 10px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
h1 { max-width: 750px; margin: 0 0 12px; color: #292826; font-size: 36px; font-weight: 600; line-height: 1.15; letter-spacing: -.03em; }
.cover-description { margin: 0; color: #615d57; font-size: 15px; }
.cover-meta { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-top: 32px; padding-top: 22px; border-top: 1px solid #dcbda0; }
.meta-label { display: block; color: #70695f; font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
.meta-value { display: block; margin-top: 5px; color: #292826; font-size: 15px; font-weight: 600; overflow-wrap: anywhere; }
.report-section { padding: 30px 48px 36px; border-bottom: 1px solid #ded8d0; }
.section-heading { display: flex; gap: 14px; align-items: baseline; padding-bottom: 14px; margin-bottom: 20px; border-bottom: 2px solid #eb5720; break-after: avoid; }
.section-number { color: #278c6d; font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }
h2 { margin: 0; color: #292826; font-size: 21px; line-height: 1.3; font-weight: 600; }
p { margin: 0 0 14px; white-space: pre-wrap; overflow-wrap: anywhere; }
.section-caption { color: #278c6d; font-size: 11px; font-weight: 600; letter-spacing: .04em; }
.details-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 18px 0 24px; border-top: 1px solid #ded8d0; border-left: 1px solid #ded8d0; }
.detail { margin: 0; padding: 12px 16px; border-right: 1px solid #ded8d0; border-bottom: 1px solid #ded8d0; break-inside: avoid; }
dt { color: #615d57; font-size: 11px; font-weight: 600; }
dd { margin: 5px 0 0; min-height: 21px; color: #292826; font-size: 14px; font-weight: 700; line-height: 1.5; overflow-wrap: anywhere; white-space: pre-wrap; }
dd.written-response { font-weight: 400; }
.empty { color: #81796e; font-style: italic; }
.table-wrap { margin: 20px 0; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th { padding: 11px 12px; background: #f3e8dd; color: #292826; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: .035em; text-transform: uppercase; }
td { padding: 10px 12px; vertical-align: top; white-space: pre-wrap; overflow-wrap: anywhere; }
th, td { border: 1px solid #d5cabe; }
tbody tr:nth-child(even) { background: #faf7f3; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
.evidence-list { margin-top: 24px; border-top: 1px solid #ded8d0; padding-top: 14px; }
h3 { margin: 0 0 12px; color: #292826; font-size: 13px; font-weight: 600; }
.evidence-item { padding: 10px 14px; margin-bottom: 8px; border-left: 3px solid #278c6d; background: #f0f6f2; break-inside: avoid; }
.evidence-name { font-weight: 600; }
.evidence-meta { color: #615d57; font-size: 11px; }
.evidence-item p { margin: 4px 0 0; }
.report-footer { display: flex; justify-content: space-between; gap: 16px; padding: 20px 48px; color: #70695f; font-size: 10px; }
@media (max-width: 650px) { .report { margin: 0; } .cover, .report-section { padding: 24px 20px; } h1 { font-size: 28px; } .details-grid, .cover-meta { grid-template-columns: 1fr; } .report-footer { padding: 20px; flex-wrap: wrap; } }
@page { size: A4; margin: 16mm 12mm; }
@media print { :root { background: #fff; } body { font-size: 10pt; } .report { max-width: none; margin: 0; box-shadow: none; } .cover { padding: 14mm 0 10mm; } .report-section { padding: 6mm 0; break-before: page; } .report-section:first-of-type { break-before: auto; } h1 { font-size: 28pt; } h2 { font-size: 16pt; } .table-wrap { overflow: visible; } table { font-size: 8pt; } th { font-size: 7pt; } th, td { padding: 6px 8px; } .report-footer { padding: 6mm 0; } .cover, th, tbody tr:nth-child(even), .evidence-item { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
`;
