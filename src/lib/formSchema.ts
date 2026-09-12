export const FORM_FIELD_TYPES = [
  "text", "textarea", "email", "tel", "number", "date", "select", "radio", "checkbox", "checkboxes", "signature",
] as const;

export type FormFieldType = typeof FORM_FIELD_TYPES[number];

/** A rectangle on a page as fractions (0-1) of the page width and height. */
export interface FormBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Where a field is written on a replica page: its write-in box, and for
 *  choice fields the tick box of each option (null = not on the page). */
export interface FormPlacement {
  page: number;
  box: FormBox | null;
  options: (FormBox | null)[];
}

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  helpText: string;
  options: string[];
  placement?: FormPlacement;
}

export const LAYOUT_CELL_KINDS = ["label", "field", "option", "blank", "text"] as const;
export type LayoutCellKind = typeof LAYOUT_CELL_KINDS[number];

/** One cell of the paper grid: a printed caption, a write-in box bound to a
 *  field, a tick box for one option of a choice field, a run of printed text
 *  (note, declaration, footer line) or empty space. */
export interface FormLayoutCell {
  kind: LayoutCellKind;
  /** label: the caption · option: the printed choice · text: the printed
   *  passage · field: an inline caption printed inside the box ("Other:") */
  text: string;
  /** field this cell belongs to (field / option cells; optional on labels) */
  fieldId: string;
  span: number;
}

export interface FormLayoutRow {
  cells: FormLayoutCell[];
}

export interface FormSection {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  /** number of grid columns the rows are laid out on */
  columns: number;
  /** printed width of each column as a percentage; [] = equal columns */
  widths: number[];
  /** the paper grid, top to bottom; empty = lay the fields out automatically */
  rows: FormLayoutRow[];
  /** text printed in a solid colour strip (contact footer, notice); "" = none */
  banner: string;
  /** this section starts a new printed page */
  pageBreak: boolean;
}

/** One page of the uploaded form as an image; the replica draws the fields
 *  on top of it, so the printed page is reproduced exactly. */
export interface FormPage {
  /** data URL while drafting, storage URL once saved */
  src: string;
  width: number;
  height: number;
  /** storage object path, "" until saved */
  path: string;
}

export interface FormDefinition {
  title: string;
  description: string;
  sections: FormSection[];
  /** printed colour of the title, CSS hex; "" = the default */
  titleColor: string;
  /** colour of banners and tick highlights, CSS hex; "" = the default */
  accentColor: string;
  /** letterhead / logo cropped from the uploaded page as a data URL; "" = none */
  masthead: string;
  /** page images of a replica form; [] = the form is rebuilt from sections */
  pages: FormPage[];
}

export type FormAnswer = string | boolean | string[];
export type FormAnswers = Record<string, FormAnswer>;

export const MAX_FORM_FIELDS = 150;
export const MAX_LAYOUT_COLUMNS = 16;
export const MAX_LAYOUT_ROWS = 200;
export const MAX_MASTHEAD_CHARS = 220_000;
export const MAX_FORM_PAGES = 12;
export const MAX_PAGE_SRC_CHARS = 6_000_000;
export const CHOICE_FIELD_TYPES: readonly FormFieldType[] = ["select", "radio", "checkboxes"];
/** field types that need a whole row of the auto layout */
const WIDE_FIELD_TYPES: readonly FormFieldType[] = ["textarea", "radio", "checkboxes", "checkbox"];
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function colorValue(value: unknown): string {
  return typeof value === "string" && HEX_COLOR.test(value.trim()) ? value.trim().toLowerCase() : "";
}

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid form structure.");
  return value as Record<string, unknown>;
}

/** Trimmed string, or "" for anything that is not a string; hard-capped. */
function text(value: unknown, limit: number): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

const ID_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const PAGE_SRC = /^(?:https:\/\/[^\s"'<>]+|data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*)$/;

const fraction = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : null;

/** A plausible box: inside the page and at least a sliver in size. */
export function readBox(value: unknown): FormBox | null {
  if (!value || typeof value !== "object") return null;
  const box = value as Record<string, unknown>;
  const x = fraction(box.x);
  const y = fraction(box.y);
  const w = fraction(box.w);
  const h = fraction(box.h);
  if (x === null || y === null || w === null || h === null) return null;
  const width = Math.min(w, 1 - x);
  const height = Math.min(h, 1 - y);
  if (width < 0.004 || height < 0.003) return null;
  const round = (v: number) => Math.round(v * 10000) / 10000;
  return { x: round(x), y: round(y), w: round(width), h: round(height) };
}

function readPlacement(value: unknown, optionCount: number): FormPlacement | undefined {
  if (!value || typeof value !== "object") return undefined;
  const placement = value as Record<string, unknown>;
  const page = Number.isInteger(placement.page) && (placement.page as number) >= 1 ? Math.min(placement.page as number, MAX_FORM_PAGES) : 1;
  const box = readBox(placement.box);
  const options = Array.from({ length: optionCount }, (_, index) => Array.isArray(placement.options) ? readBox(placement.options[index]) : null);
  if (!box && !options.some(Boolean)) return undefined;
  return { page, box, options };
}

function readPages(value: unknown): FormPage[] {
  if (!Array.isArray(value)) return [];
  const pages: FormPage[] = [];
  for (const entry of value.slice(0, MAX_FORM_PAGES)) {
    if (!entry || typeof entry !== "object") continue;
    const page = entry as Record<string, unknown>;
    const src = typeof page.src === "string" && page.src.length <= MAX_PAGE_SRC_CHARS && PAGE_SRC.test(page.src) ? page.src : "";
    const width = Number.isInteger(page.width) && (page.width as number) > 0 && (page.width as number) <= 10000 ? page.width as number : 0;
    const height = Number.isInteger(page.height) && (page.height as number) > 0 && (page.height as number) <= 10000 ? page.height as number : 0;
    if (!src || !width || !height) continue;
    pages.push({ src, width, height, path: text(page.path, 300) });
  }
  return pages;
}

/**
 * The AI's output is repaired rather than rejected wherever a repair is
 * unambiguous: bad ids are renamed (and the layout follows), a field whose
 * caption only exists as a label cell gets that caption, duplicate or empty
 * options are dropped, option cells that differ from the option list only by
 * case are matched, and sections with nothing to print are removed. Only a
 * form with no usable content at all is an error.
 */
export function parseFormDefinition(value: unknown): FormDefinition {
  const source = objectValue(value);
  const title = text(source.title, 200) || "Form";
  const description = text(source.description, 5000);
  if (!Array.isArray(source.sections)) throw new Error("The form has no sections.");
  const identifiers = new Set<string>();
  let fieldCount = 0;
  let generated = 0;
  const readId = (value: unknown, prefix: string): string => {
    let id = text(value, 80);
    if (!ID_PATTERN.test(id) || identifiers.has(id)) {
      const base = ID_PATTERN.test(id) ? id : prefix;
      do id = `${base}_${++generated}`; while (identifiers.has(id));
    }
    identifiers.add(id);
    return id;
  };
  const sections: FormSection[] = [];
  for (const entry of source.sections.slice(0, 30)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const section = entry as Record<string, unknown>;
    const id = readId(section.id, "section");
    // the layout refers to the AI's own ids, so renames must be followed there
    const renamed = new Map<string, string>();
    const fields: FormField[] = [];
    for (const raw of Array.isArray(section.fields) ? section.fields : []) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      if (fieldCount >= MAX_FORM_FIELDS) break;
      const field = raw as Record<string, unknown>;
      let type: FormFieldType = FORM_FIELD_TYPES.includes(field.type as FormFieldType) ? field.type as FormFieldType : "text";
      const seen = new Set<string>();
      const options: string[] = [];
      for (const option of Array.isArray(field.options) ? field.options : []) {
        const label = text(option, 300);
        if (label && !seen.has(label) && options.length < 80) { seen.add(label); options.push(label); }
      }
      if (CHOICE_FIELD_TYPES.includes(type) && !options.length) type = "text";
      else if (!CHOICE_FIELD_TYPES.includes(type) && options.length) type = "radio";
      const original = text(field.id, 80);
      const fieldId = readId(field.id, "field");
      if (original && original !== fieldId) renamed.set(original, fieldId);
      fieldCount += 1;
      const placement = readPlacement(field.placement, options.length);
      fields.push({
        id: fieldId,
        label: text(field.label, 500),
        type,
        required: field.required === true,
        helpText: text(field.helpText, 3000),
        options: CHOICE_FIELD_TYPES.includes(type) ? options : [],
        ...(placement ? { placement } : {}),
      });
    }
    const layout = parseLayout(section, fields, renamed);
    const sectionTitle = text(section.title, 300);
    // a field whose caption was only given as a label cell takes it from there;
    // a tick grid under a heading is named after the heading
    for (const field of fields) {
      if (field.label) continue;
      const caption = layout.rows.flatMap(row => row.cells).find(cell => cell.fieldId === field.id && cell.kind !== "option" && cell.text);
      field.label = caption?.text ?? (fields.length === 1 && sectionTitle ? sectionTitle.replace(/[:\s]+$/, "") : `Field ${fields.indexOf(field) + 1}`);
    }
    const sectionDescription = text(section.description, 5000);
    const banner = text(section.banner, 1000);
    const printsSomething = fields.length || sectionDescription || banner || layout.rows.some(row => row.cells.some(cell => cell.kind === "text" && cell.text));
    if (!printsSomething) continue;
    sections.push({
      id,
      title: sectionTitle,
      description: sectionDescription,
      fields,
      ...layout,
      banner,
      pageBreak: section.pageBreak === true,
    });
  }
  if (!sections.length) throw new Error("No fields or printed text were found.");
  const masthead = typeof source.masthead === "string" && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(source.masthead) && source.masthead.length <= MAX_MASTHEAD_CHARS
    ? source.masthead
    : "";
  const pages = readPages(source.pages);
  if (pages.length) {
    // a placement off the end of the page set is not on any page
    for (const section of sections) {
      for (const field of section.fields) if (field.placement && field.placement.page > pages.length) delete field.placement;
    }
  }
  return { title, description, sections, titleColor: colorValue(source.titleColor), accentColor: colorValue(source.accentColor), masthead, pages };
}

/** The box each id in an analysed page stands for. */
export interface ReplicaPageBoxes {
  boxes: { id: string; x: number; y: number; w: number; h: number; kind?: string }[];
}

/**
 * Turns the AI's replica answer (fields bound to detected boxes by id, or to
 * measured coordinates) into a form definition with one section per page.
 * Unknown ids and empty boxes leave the field unplaced; it is then listed
 * under the pages instead of disappearing.
 */
export function parseReplicaOutput(value: unknown, pages: ReplicaPageBoxes[]): FormDefinition {
  const source = objectValue(value);
  if (!Array.isArray(source.fields)) throw new Error("No fields were identified.");
  const pageCount = Math.max(1, pages.length);
  const resolve = (pageIndex: number, boxId: unknown, box: unknown, tick = false): FormBox | null => {
    const id = text(boxId, 40);
    if (id) {
      const found = pages[pageIndex]?.boxes.find(candidate => candidate.id === id);
      // a tick can never be a write-on line, whatever the model says
      if (found && tick && found.kind === "line") return null;
      if (found) return readBox(found);
    }
    return readBox(box);
  };
  const perPage: Record<string, unknown>[][] = Array.from({ length: pageCount }, () => []);
  for (const entry of source.fields.slice(0, MAX_FORM_FIELDS)) {
    if (!entry || typeof entry !== "object") continue;
    const field = entry as Record<string, unknown>;
    const page = Number.isInteger(field.page) ? Math.min(pageCount, Math.max(1, field.page as number)) : 1;
    const rawOptions = Array.isArray(field.options) ? field.options : [];
    const optionTexts: string[] = [];
    const optionBoxes: (FormBox | null)[] = [];
    for (const option of rawOptions) {
      const item: Record<string, unknown> = option && typeof option === "object" ? option as Record<string, unknown> : { text: option };
      const label = text(item.text, 300);
      if (!label || optionTexts.includes(label)) continue;
      optionTexts.push(label);
      optionBoxes.push(resolve(page - 1, item.boxId, item.box, true));
    }
    perPage[page - 1].push({
      id: field.id,
      label: field.label,
      type: field.type,
      required: field.required,
      helpText: field.helpText,
      options: optionTexts,
      placement: { page, box: resolve(page - 1, field.boxId, field.box), options: optionBoxes },
    });
  }
  const sections = perPage.map((fields, index) => ({
    id: `page_${index + 1}`,
    title: pageCount > 1 ? `Page ${index + 1}` : "",
    description: "",
    fields,
    columns: 4,
    widths: [],
    rows: [],
    banner: "",
    pageBreak: false,
  })).filter(section => section.fields.length);
  if (!sections.length) throw new Error("No fields were identified.");
  return parseFormDefinition({ title: source.title, description: source.description, sections, titleColor: "", accentColor: "", masthead: "", pages: [] });
}

/** Layout is decorative, so it is repaired rather than rejected: cells that
 *  point at a missing field become text or blank space; an option cell whose
 *  wording is not in the option list is added to it (the print wins). */
function parseLayout(section: Record<string, unknown>, fields: FormField[], renamed: Map<string, string>): Pick<FormSection, "columns" | "widths" | "rows"> {
  const byId = new Map(fields.map(field => [field.id, field]));
  const columns = Number.isInteger(section.columns) && (section.columns as number) >= 1
    ? Math.min(section.columns as number, MAX_LAYOUT_COLUMNS)
    : 4;
  // printed proportions: one positive number per column, normalised to 100
  let widths: number[] = [];
  if (Array.isArray(section.widths) && section.widths.length === columns && section.widths.every(w => typeof w === "number" && Number.isFinite(w) && w > 0)) {
    const total = (section.widths as number[]).reduce((sum, w) => sum + w, 0);
    widths = (section.widths as number[]).map(w => Math.round((w / total) * 1000) / 10);
  }
  if (!Array.isArray(section.rows)) return { columns, widths, rows: [] };
  const rows: FormLayoutRow[] = [];
  for (const entry of section.rows.slice(0, MAX_LAYOUT_ROWS)) {
    if (!entry || typeof entry !== "object" || !Array.isArray((entry as { cells?: unknown }).cells)) continue;
    const cells: FormLayoutCell[] = [];
    let used = 0;
    for (const raw of (entry as { cells: unknown[] }).cells) {
      if (!raw || typeof raw !== "object") continue;
      const cell = raw as Record<string, unknown>;
      let kind = LAYOUT_CELL_KINDS.includes(cell.kind as LayoutCellKind) ? cell.kind as LayoutCellKind : "blank";
      let cellText = text(cell.text, kind === "text" ? 3000 : 500);
      const askedId = text(cell.fieldId, 80);
      let fieldId = renamed.get(askedId) ?? askedId;
      const span = Math.max(1, Math.min(Number.isInteger(cell.span) ? (cell.span as number) : 1, columns - used || 1));
      const field = byId.get(fieldId);
      if (kind === "field" && !field) kind = cellText ? "text" : "blank";
      if (kind === "option") {
        if (!field || !CHOICE_FIELD_TYPES.includes(field.type) || !cellText) kind = cellText ? "text" : "blank";
        else {
          const match = field.options.find(option => option === cellText) ?? field.options.find(option => option.toLowerCase() === cellText.toLowerCase());
          if (match) cellText = match;
          else if (field.options.length < 80) field.options.push(cellText);
          else kind = "text";
        }
      }
      if ((kind === "label" || kind === "text") && !field) fieldId = "";
      if (kind === "blank") fieldId = "";
      cells.push({ kind, text: kind === "blank" ? "" : kind === "field" ? cellText.slice(0, 80) : cellText, fieldId, span });
      used += span;
      if (used >= columns) break;
    }
    if (cells.length) rows.push({ cells });
  }
  return { columns, widths, rows };
}

/** Fields the section's grid does not place — rendered after it so nothing
 *  the AI or an editor left out of the layout disappears. */
export function unplacedFields(section: FormSection): FormField[] {
  const placed = new Set<string>();
  for (const row of section.rows) for (const cell of row.cells) if (cell.kind !== "blank" && cell.fieldId) placed.add(cell.fieldId);
  return section.fields.filter(field => !placed.has(field.id));
}

/** Paper-style grid for fields without an explicit layout: two label/box
 *  pairs per row on a four-column grid, wide fields on a row of their own. */
export function autoLayout(fields: FormField[]): FormLayoutRow[] {
  const rows: FormLayoutRow[] = [];
  let pending: FormLayoutCell[] = [];
  const flush = () => {
    if (!pending.length) return;
    if (pending.length === 2) pending.push({ kind: "blank", text: "", fieldId: "", span: 2 });
    rows.push({ cells: pending });
    pending = [];
  };
  for (const field of fields) {
    if (field.type === "checkbox") {
      // the tick box carries its own caption
      flush();
      rows.push({ cells: [{ kind: "field", text: "", fieldId: field.id, span: 4 }] });
      continue;
    }
    if (WIDE_FIELD_TYPES.includes(field.type)) {
      flush();
      rows.push({ cells: [
        { kind: "label", text: field.label, fieldId: field.id, span: 1 },
        { kind: "field", text: "", fieldId: field.id, span: 3 },
      ] });
      continue;
    }
    pending.push({ kind: "label", text: field.label, fieldId: field.id, span: 1 }, { kind: "field", text: "", fieldId: field.id, span: 1 });
    if (pending.length === 4) flush();
  }
  flush();
  return rows;
}

export function validateFormAnswers(definition: FormDefinition, answers: FormAnswers): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const section of definition.sections) {
    for (const field of section.fields) {
      const value = answers[field.id];
      const empty = value === undefined || value === false || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && !value.length);
      if (field.required && empty) {
        errors[field.id] = "This field is required.";
        continue;
      }
      if (empty) continue;
      if (field.type === "checkbox") {
        if (typeof value !== "boolean") errors[field.id] = "Choose a checkbox value.";
      } else if (field.type === "checkboxes") {
        if (!Array.isArray(value) || value.some(option => !field.options.includes(option))) errors[field.id] = "Choose from the listed options.";
      } else if (typeof value !== "string") {
        errors[field.id] = "Enter a text value.";
      } else if (CHOICE_FIELD_TYPES.includes(field.type) && !field.options.includes(value)) {
        errors[field.id] = "Choose from the listed options.";
      } else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[field.id] = "Enter a valid email address.";
      } else if (field.type === "number" && !Number.isFinite(Number(value))) {
        errors[field.id] = "Enter a valid number.";
      } else if (field.type === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) {
        errors[field.id] = "Enter a valid date.";
      }
    }
  }
  return errors;
}