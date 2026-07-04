interface FormFieldSchema {
  id?: unknown;
  label?: unknown;
  required?: unknown;
}

interface FormBlockSchema {
  formId: string;
  fields: FormFieldSchema[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDoc(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function collectFormBlocks(node: unknown, blocks: FormBlockSchema[]) {
  if (!isRecord(node)) return;

  if (node.type === "formBlock" && isRecord(node.attrs)) {
    const attrs = node.attrs;
    blocks.push({
      formId: typeof attrs.formId === "string" ? attrs.formId : "",
      fields: Array.isArray(attrs.fields) ? attrs.fields : [],
    });
  }

  if (Array.isArray(node.content)) {
    node.content.forEach((child) => collectFormBlocks(child, blocks));
  }
}

export function findFormBlockSchema(
  rawDocs: string[],
  formId: string
): FormBlockSchema | null {
  const blocks: FormBlockSchema[] = [];
  rawDocs.forEach((rawDoc) => collectFormBlocks(parseDoc(rawDoc), blocks));
  return blocks.find((block) => block.formId === formId) ?? null;
}

export function missingRequiredFields(
  fields: FormFieldSchema[],
  data: Record<string, unknown>
): string[] {
  return fields
    .filter((field) => field.required === true && typeof field.id === "string")
    .filter((field) => {
      const value = data[field.id as string];
      return typeof value !== "string" || value.trim() === "";
    })
    .map((field) =>
      typeof field.label === "string" && field.label.trim()
        ? field.label.trim()
        : (field.id as string)
    );
}

