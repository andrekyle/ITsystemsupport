const PRIVATE_FIELD_REQUEST =
  /\b(?:e-?mails?(?:\s+addresses?)?|phone(?:\s+numbers?)?|telephone(?:\s+numbers?)?|mobile(?:\s+numbers?)?|cell(?:phone)?(?:\s+numbers?)?|contact\s+(?:details?|information|number)|national\s+id|sa\s+id|id(?:\s*(?:number|no\.?|#))?|identity(?:\s*(?:number|no\.?))?|(?:learner|student)(?:['’]s)?\s+id|(?:my|his|her|their)\s+(?:id|number))\b/i;
const EMAIL_VALUE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const SOUTH_AFRICAN_ID = /\b\d{6}[\s-]?\d{4}[\s-]?\d{3}\b/g;
const FORMATTED_PHONE = /(?:\+\d{1,3}[\s().-]?)?(?:\(?\d{2,4}\)?[\s.-]){2}\d{3,4}/g;
const LONG_NUMBER = /\b\d{10,15}\b/g;
const PRIVATE_KEYS = new Set([
  "id",
  "idnumber",
  "idno",
  "identity",
  "identitynumber",
  "identityno",
  "nationalid",
  "said",
  "learnerid",
  "learneridentifier",
  "studentid",
  "studentidentifier",
  "profileid",
  "email",
  "emailaddress",
  "phone",
  "phonenumber",
  "telephone",
  "telephonenumber",
  "mobile",
  "mobilenumber",
  "cell",
  "cellphone",
  "cellphonenumber",
  "cellnumber",
  "contact",
  "contactinfo",
  "contactinformation",
  "contactdetails",
  "contactnumber",
]);

export const PRIVATE_LEARNER_INFO_REFUSAL =
  "I can't provide or retrieve learner ID numbers, phone numbers, or email addresses.";

export function containsProtectedLearnerInfoRequest(text: string): boolean {
  return PRIVATE_FIELD_REQUEST.test(text) || containsPrivateValue(text);
}

export function redactPrivateValues(text: string): string {
  return text
    .replace(EMAIL_VALUE, "[redacted email]")
    .replace(SOUTH_AFRICAN_ID, "[redacted ID number]")
    .replace(FORMATTED_PHONE, "[redacted phone number]")
    .replace(LONG_NUMBER, "[redacted private number]");
}

export function sanitizeAssistantData(value: unknown): unknown {
  if (typeof value === "string") return redactPrivateValues(value);
  if (typeof value === "number" && Number.isInteger(value) && /^\d{10,15}$/.test(String(value))) {
    return "[redacted private number]";
  }
  if (Array.isArray(value)) return value.map(sanitizeAssistantData);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) => {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      const privateField = PRIVATE_KEYS.has(normalizedKey) ||
        /(?:email|emailaddress|phone|phonenumber|telephone|telephonenumber|mobile|mobilenumber|cellphone|cellphonenumber|cellnumber|contactnumber|idnumber|identitynumber|nationalid)$/.test(normalizedKey);
      return privateField
        ? []
        : [[key, sanitizeAssistantData(child)]];
    })
  );
}

function containsPrivateValue(text: string): boolean {
  return [EMAIL_VALUE, SOUTH_AFRICAN_ID, FORMATTED_PHONE, LONG_NUMBER].some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}
