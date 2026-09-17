export type LessonTableBlock = { kind: "table"; headers: string[]; rows: string[][]; sourceStart?: number; sourceEnd?: number };
export type LessonTextBlock = { kind: "paragraph"; text: string } | LessonTableBlock;

type CellType = "text" | "description" | "number" | "index" | "code" | "date" | "duration" | "unit";
type Header = { text: string; type: CellType };
type Line = { text: string; start: number; end: number };
type Match = { table: LessonTableBlock; end: number };

// Recognising a header alone is insufficient: flattened tables also need complete
// rows with values appropriate to their columns. Ordinary lists stay as text.
const headerTypes: Record<string, CellType> = {
  "serial no": "index", "serial number": "index", "s no": "index", "sr no": "index", "no": "index", "number": "index",
  "item": "text", "item name": "text", "product": "text", "product name": "text", "name": "text",
  "code": "code", "item code": "code", "product code": "code", "id": "code", "reference": "code", "sku": "code",
  "description": "description", "details": "description", "task description": "description",
  "rate": "number", "unit rate": "number", "price": "number", "unit price": "number", "cost": "number",
  "amount": "number", "amt": "number", "total": "number", "subtotal": "number", "balance": "number",
  "quantity": "number", "qty": "number", "count": "number", "hours": "number", "score": "number", "marks": "number",
  "age": "number", "weight": "number", "length": "number", "width": "number", "height": "number", "percentage": "number",
  "unit": "unit", "units": "unit", "uom": "unit", "unit of measure": "unit",
  "date": "date", "start date": "date", "end date": "date", "due date": "date",
  "duration": "duration", "time": "duration", "estimated time": "duration",
  "task": "text", "activity": "text", "owner": "text", "assignee": "text", "status": "text",
  "department": "text", "role": "text", "location": "text", "city": "text", "category": "text",
  "resource": "text", "material": "text", "employee": "text", "student": "text", "result": "text",
};

const plain = (text: string) => text.replace(/\*\*|__/g, "").trim();
const key = (text: string) => plain(text).toLowerCase().replace(/[.:#]/g, "").replace(/\s+/g, " ").trim();
const unitSuffix = /^\((?:[A-Z]{3}|[$€£¥%]|(?:kg|g|km|m|cm|mm|h|hr|hrs|hours|minutes|days|%))\)$/i;

function headerType(text: string): CellType | undefined {
  const label = key(text.replace(/\s*\([^)]*\)\s*$/, ""));
  return headerTypes[label];
}

function isNumber(text: string): boolean {
  return /^(?:[A-Z]{3}\s*)?[$€£¥R]?\s*[+-]?(?:\d{1,3}(?:[, ]\d{3})+|\d+)(?:[.,]\d+)?\s*%?$/.test(plain(text))
    || /^\(\d+(?:[.,]\d+)?\)$/.test(plain(text));
}

function fits(text: string, type: CellType): boolean {
  const value = plain(text);
  if (!value) return false;
  switch (type) {
    case "index": return /^\d+[.)]?$/.test(value);
    case "number": return isNumber(value);
    case "code": return value.length <= 70 && /^[\p{L}\p{N}][\p{L}\p{N}_.\/-]*$/u.test(value)
      && (/\d|[_\/-]/.test(value) || /^[A-Z]{1,12}$/.test(value));
    case "date": return /^(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})$/.test(value);
    case "duration": return isNumber(value) || /^\d+(?:\.\d+)?\s*(?:minutes?|mins?|hours?|hrs?|days?|weeks?|months?|seconds?|secs?)$/i.test(value) || /^\d{1,3}:\d{2}$/.test(value);
    case "unit": return value.length <= 40 && !/[.!?:]$/.test(value) && !isNumber(value) && /^[\p{L}\p{N}%/²³ ._-]+$/u.test(value);
    case "description": return value.length <= 8000;
    case "text": return value.length <= 180 && !/[.!?]$/.test(value);
  }
}

type Delimiter = "pipe" | "tab" | "spaces";
function cells(text: string, delimiter: Delimiter): string[] {
  if (delimiter === "pipe") {
    const result: string[] = [];
    const value = text.trim();
    let cell = "";
    for (let index = 0; index < value.length; index++) {
      const character = value[index];
      if (character === "\\" && /[\\|]/.test(value[index + 1] ?? "")) cell += value[++index];
      else if (character === "|") { result.push(cell.trim()); cell = ""; }
      else cell += character;
    }
    result.push(cell.trim());
    if (value.startsWith("|") && result[0] === "") result.shift();
    if (value.endsWith("|") && result.at(-1) === "") result.pop();
    return result.map(value => value.replace(/\s*<br\s*\/?>\s*/gi, "\n"));
  }
  return text.trim().split(delimiter === "tab" ? /\t+/ : / {2,}/).map(cell => cell.trim());
}

function delimitedTable(lines: Line[], start: number): Match | undefined {
  const first = lines[start].text;
  const delimiter: Delimiter | undefined = /(?<!\\)\|/.test(first) ? "pipe" : /\t/.test(first) ? "tab" : / {2,}/.test(first) ? "spaces" : undefined;
  if (!delimiter) return undefined;
  const headers = cells(first, delimiter);
  if (headers.length < 2 || headers.length > 16 || headers.some(cell => !cell || cell.length > 160 || isNumber(cell))) return undefined;
  const types = headers.map(headerType);
  const knownHeaders = types.filter(Boolean).length;
  if (delimiter === "spaces" && knownHeaders < 2) return undefined;
  let cursor = start + 1;
  let markdown = false;
  if (cursor < lines.length && delimiter === "pipe") {
    const separator = cells(lines[cursor].text, delimiter);
    if (separator.length === headers.length && separator.every(cell => /^:?-{3,}:?$/.test(cell))) {
      markdown = true;
      cursor++;
    }
  }
  const rows: string[][] = [];
  while (cursor < lines.length) {
    const row = cells(lines[cursor].text, delimiter);
    if (row.length === 1) break;
    // A visibly tabular but broken row should not be silently assigned columns.
    if (row.length !== headers.length) return undefined;
    if (types.some((type, index) => type && type !== "text" && type !== "description" && !fits(row[index], type))) return undefined;
    rows.push(row);
    cursor++;
  }
  if (!rows.length || (!markdown && knownHeaders === 0 && rows.length < 2)) return undefined;
  return { table: { kind: "table", headers, rows }, end: cursor };
}

function flattenedTable(lines: Line[], start: number): Match | undefined {
  const headers: Header[] = [];
  let cursor = start;
  while (cursor < lines.length && headers.length < 16) {
    let text = lines[cursor].text;
    let consumed = 1;
    const next = lines[cursor + 1]?.text;
    // PDF extractors commonly wrap a single column heading onto separate lines.
    if (next && ((key(text) === "item" && key(next) === "code") || (/^(?:serial|s|sr)$/i.test(key(text)) && key(next) === "no"))) {
      text += ` ${next}`;
      consumed++;
    }
    const type = headerType(text);
    if (!type) break;
    const suffix = lines[cursor + consumed]?.text;
    if (suffix && unitSuffix.test(plain(suffix))) { text += ` ${suffix}`; consumed++; }
    headers.push({ text, type });
    cursor += consumed;
  }
  if (headers.length < 3 || !headers.some(header => !["text", "description", "unit"].includes(header.type))) return undefined;
  // Repeated headings are more likely separate text blocks than a table schema.
  if (new Set(headers.map(header => key(header.text))).size !== headers.length) return undefined;

  const rowAt = (offset: number): { row: string[]; end: number } | undefined => {
    const read = (column: number, index: number, values: string[]): { row: string[]; end: number } | undefined => {
      if (column === headers.length) return { row: values, end: index };
      if (index >= lines.length) return undefined;
      const type = headers[column].type;
      const maxLines = type === "description" ? Math.min(20, lines.length - index) : 1;
      for (let count = 1; count <= maxLines; count++) {
        const value = lines.slice(index, index + count).map(line => line.text).join("\n");
        if (!fits(value, type)) continue;
        const match = read(column + 1, index + count, [...values, value]);
        if (match) return match;
      }
      return undefined;
    };
    return read(0, offset, []);
  };

  const rows: string[][] = [];
  while (cursor < lines.length) {
    const row = rowAt(cursor);
    if (!row) {
      // An incomplete next row with a strong row identifier makes the extraction
      // ambiguous. Leave the complete source unchanged for manual editing.
      const firstType = headers[0].type;
      if (["index", "code", "date"].includes(firstType) && fits(lines[cursor].text, firstType)) return undefined;
      break;
    }
    rows.push(row.row);
    cursor = row.end;
  }
  if (!rows.length) return undefined;
  return { table: { kind: "table", headers: headers.map(header => header.text), rows }, end: cursor };
}


function expandInlineMarkdownTables(source: string): string {
  return source.split(/\r?\n/).map(line => {
    if (!/(?<!\\)\|/.test(line) || !/\|\s*:?-{3,}:?\s*\|/.test(line)) return line;
    const firstPipe = line.indexOf("|");
    if (firstPipe < 0) return line;
    const prefix = line.slice(0, firstPipe).trim();
    const parts = cells(line.slice(firstPipe), "pipe").filter(cell => cell.trim());
    const sepStart = parts.findIndex((part, index) => /^:?-{3,}:?$/.test(part) && index > 0);
    if (sepStart < 2) return line;
    let sepEnd = sepStart;
    while (sepEnd < parts.length && /^:?-{3,}:?$/.test(parts[sepEnd])) sepEnd++;
    const width = sepStart;
    if (sepEnd - sepStart !== width) return line;
    const headers = parts.slice(0, width);
    const values = parts.slice(sepEnd);
    if (!headers.every(Boolean) || values.length < width || values.length % width !== 0) return line;
    const rows: string[] = [];
    for (let index = 0; index < values.length; index += width) rows.push(`| ${values.slice(index, index + width).join(" | ")} |`);
    return [prefix, `| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`, ...rows].filter(Boolean).join("\n");
  }).join("\n");
}

/** Reconstruct clearly tabular imports while retaining all unrecognised source text. */
export function parseLessonTextBlocks(paragraphs: readonly string[]): LessonTextBlock[] {
  const ranges: { text: string; start: number; end: number }[] = [];
  let source = "";
  for (const text of paragraphs) {
    if (ranges.length) source += "\n\n";
    ranges.push({ text, start: source.length, end: source.length + text.length });
    source += text;
  }
  const lines: Line[] = [];
  source = expandInlineMarkdownTables(source);
  for (const match of source.matchAll(/[^\r\n]+/g)) {
    if (match[0].trim()) lines.push({ text: match[0].trim(), start: match.index!, end: match.index! + match[0].length });
  }
  const blocks: LessonTextBlock[] = [];
  const emitSource = (start: number, end: number) => {
    for (const paragraph of ranges) {
      if (paragraph.end <= start || paragraph.start >= end) continue;
      const complete = start <= paragraph.start && end >= paragraph.end;
      const text = complete ? paragraph.text : source.slice(Math.max(start, paragraph.start), Math.min(end, paragraph.end)).trim();
      if (text) blocks.push({ kind: "paragraph", text });
    }
  };
  let copiedThrough = 0;
  for (let index = 0; index < lines.length;) {
    const match = delimitedTable(lines, index) ?? flattenedTable(lines, index);
    if (!match) { index++; continue; }
    emitSource(copiedThrough, lines[index].start);
    const startOffset = lines[index].start;
    const endOffset = lines[match.end - 1].end;
    match.table.sourceStart = ranges.findIndex(paragraph => paragraph.start <= startOffset && paragraph.end >= startOffset);
    match.table.sourceEnd = ranges.findIndex(paragraph => paragraph.start < endOffset && paragraph.end >= endOffset) + 1;
    blocks.push(match.table);
    copiedThrough = lines[match.end - 1].end;
    index = match.end;
  }
  emitSource(copiedThrough, source.length);
  return blocks;
}

const escapeCell = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/\r?\n/g, "<br>");

/** Semantic, scrollable table markup for saved slide HTML and document exports. */
export function lessonTableHtml(table: LessonTableBlock): string {
  return `<div class="lesson-table-scroll"><table class="data lesson-table"><thead><tr>${table.headers.map(header => `<th scope="col">${escapeCell(header)}</th>`).join("")}</tr></thead><tbody>${table.rows.map(row => `<tr>${row.map(cell => `<td>${escapeCell(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

/** Keep table rows atomic when the unit source parser stores paragraph text. */
export function lessonTableMarkdown(table: LessonTableBlock): string {
  const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
  const row = (values: string[]) => `| ${values.map(escape).join(" | ")} |`;
  return [row(table.headers), row(table.headers.map(() => "---")), ...table.rows.map(row)].join("\n");
}
