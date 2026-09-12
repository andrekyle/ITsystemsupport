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

export interface FormSection {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
}

export interface FormDefinition {
  title: string;
  description: string;
  sections: FormSection[];
}

export type FormAnswer = string | boolean | string[];
export type FormAnswers = Record<string, FormAnswer>;

export const MAX_FORM_FIELDS = 150;
export const CHOICE_FIELD_TYPES: readonly FormFieldType[] = ["select", "radio", "checkboxes"];

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
    if (!Array.isArray(section.fields) || !section.fields.length) {
      throw new Error("Each section must have at least one field.");
    }
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
    return {
      id,
      title: textValue(section.title, 300, "section title", true),
      description: textValue(section.description, 5000, "section description"),
      fields,
    };
  });
  return { title, description, sections };
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