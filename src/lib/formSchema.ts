export const FORM_FIELD_TYPES = [
  "text", "textarea", "email", "tel", "number", "date", "select", "radio", "checkbox", "checkboxes", "signature",
] as const;

export type FormFieldType = typeof FORM_FIELD_TYPES[number];

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  helpText: string;
  options: string[];
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
}

export type FormAnswer = string | boolean | string[];
export type FormAnswers = Record<string, FormAnswer>;

export const MAX_FORM_FIELDS = 150;
export const MAX_LAYOUT_COLUMNS = 16;
export const MAX_LAYOUT_ROWS = 200;
export const MAX_MASTHEAD_CHARS = 220_000;
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

function textValue(value: unknown, limit: number, label: string, required = false): string {
  if (typeof value !== "string" || value.length > limit || (required && !value.trim())) {
    throw new Error(`Invalid ${label}.`);
  }
  return value.trim();
}

export function parseFormDefinition(value: unknown): FormDefinition {
  const source = objectValue(value);
  const title = textValue(source.title, 200, "form title", true);
  const description = textValue(source.description, 5000, "form description");
  if (!Array.isArray(source.sections) || !source.sections.length || source.sections.length > 30) {
    throw new Error("A form must contain between 1 and 30 sections.");
  }
  const identifiers = new Set<string>();
  let fieldCount = 0;
  const readId = (value: unknown) => {
    const id = textValue(value, 80, "field or section identifier", true);
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id) || identifiers.has(id)) {
      throw new Error("Form field and section identifiers must be unique.");
    }
    identifiers.add(id);
    return id;
  };
  const sections = source.sections.map((entry): FormSection => {
    const section = objectValue(entry);
    const id = readId(section.id);
    if (!Array.isArray(section.fields)) throw new Error("Each section must list its fields.");
    const fields = section.fields.map((entry): FormField => {
      const field = objectValue(entry);
      fieldCount += 1;
      if (fieldCount > MAX_FORM_FIELDS) throw new Error(`A form can contain at most ${MAX_FORM_FIELDS} fields.`);
      const type = field.type as FormFieldType;
      if (!FORM_FIELD_TYPES.includes(type) || typeof field.required !== "boolean") {
        throw new Error("Invalid field type or required setting.");
      }
      if (!Array.isArray(field.options) || field.options.length > 80) throw new Error("Invalid field options.");
      const options = field.options.map(option => textValue(option, 300, "option", true));
      if (new Set(options).size !== options.length) throw new Error("Field options must be unique.");
      if (CHOICE_FIELD_TYPES.includes(type) ? !options.length : options.length > 0) {
        throw new Error("Choice fields need options; other fields must not have options.");
      }
      return {
        id: readId(field.id),
        label: textValue(field.label, 500, "field label", true),
        type,
        required: field.required,
        helpText: textValue(field.helpText, 3000, "field help text"),
        options,
      };
    });
    const layout = parseLayout(section, fields);
    const description = textValue(section.description, 5000, "section description");
    const banner = textValue(section.banner ?? "", 1000, "section banner");
    // a section with no fields must still print something (a declaration, a footer)
    if (!fields.length && !description && !banner && !layout.rows.some(row => row.cells.some(cell => cell.kind === "text" && cell.text))) {
      throw new Error("Each section must have at least one field or some printed text.");
    }
    return {
      id,
      title: textValue(section.title, 300, "section title"),
      description,
      fields,
      ...layout,
      banner,
      pageBreak: section.pageBreak === true,
    };
  });
  const masthead = typeof source.masthead === "string" && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(source.masthead) && source.masthead.length <= MAX_MASTHEAD_CHARS
    ? source.masthead
    : "";
  return { title, description, sections, titleColor: colorValue(source.titleColor), accentColor: colorValue(source.accentColor), masthead };
}

/** Layout is decorative, so it is repaired rather than rejected: cells that
 *  point at a missing field or option become blank space. */
function parseLayout(section: Record<string, unknown>, fields: FormField[]): Pick<FormSection, "columns" | "widths" | "rows"> {
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
      const text = typeof cell.text === "string" ? cell.text.trim().slice(0, kind === "text" ? 3000 : 500) : "";
      let fieldId = typeof cell.fieldId === "string" ? cell.fieldId.trim() : "";
      const span = Math.max(1, Math.min(Number.isInteger(cell.span) ? (cell.span as number) : 1, columns - used || 1));
      const field = byId.get(fieldId);
      if (kind === "field" && !field) kind = text ? "text" : "blank";
      if (kind === "option" && (!field || !CHOICE_FIELD_TYPES.includes(field.type) || !field.options.includes(text))) kind = "blank";
      if ((kind === "label" || kind === "text") && !field) fieldId = "";
      if (kind === "blank") fieldId = "";
      cells.push({ kind, text: kind === "blank" ? "" : kind === "field" ? text.slice(0, 80) : text, fieldId, span });
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