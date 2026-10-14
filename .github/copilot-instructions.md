# Eruditio report generation

When a user asks the assistant to style or generate a learner, assessment, attendance, progress, or tracker report:

- Preserve all source information. Do not silently remove learner records, worksheet rows, unit standards, statuses, dates, attendance entries, narrative text, comments, sign-off details, or source inconsistencies.
- Treat uploaded PDFs and spreadsheets as authoritative source material. Extract the complete source before formatting.
- Use the Eruditio visual language: green headings and table groups, orange accents, mint summary panels, clear tables, generous spacing, and the existing Eruditio logo where available.
- Produce an editable HTML report and a print-ready PDF workflow. Keep editing controls out of printed output.
- For spreadsheets, preserve every worksheet and every populated cell. Do not invent attendance dates, ID numbers, results, or learner details that are absent from the workbook.
- For PDFs, retain the complete page content and identify page boundaries. If text extraction is imperfect, make that limitation visible rather than presenting an invented correction.
- Preserve conflicting totals or wording exactly as source information and flag them for review instead of correcting them silently.
- Validate completeness before presenting a generated report: compare source page/sheet counts and learner, unit-standard, row, and status coverage where those structures are present.
- Prefer the existing upload-to-report flow in `src/lib/uploadedReports.ts` and the Reports page rather than creating a second parser or report pipeline.

## Output template per source type

- **Spreadsheet uploads** produce a **Learner tracker report**: a deterministic, cell-for-cell rendering of every worksheet as a `.tracker` grid, enhanced with `enhanceTrackerHtml()` from `src/lib/trackerEditor.ts` so it is editable in the browser, with per-column filters, the status legend (`NYS`, `C`, `SA`, `IP`, `X`), a sign-off block, and `@page { size: A3 landscape }` for Print → Save as PDF. No AI rewriting is applied to the grid, so no cell can be lost or re-interpreted.
- **PDF uploads** are restyled by the AI into the approved 16:9 Eruditio slide deck rendered by `deckDocumentHtml()` in `src/lib/reports.ts`.
- Editing toolbars must be hidden in print output via `@media print`.
