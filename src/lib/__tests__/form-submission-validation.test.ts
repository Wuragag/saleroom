import { describe, expect, it } from "vitest";
import {
  findFormBlockSchema,
  missingRequiredFields,
} from "@/lib/form-submission-validation";

describe("form submission validation", () => {
  it("finds a form block by id inside a TipTap document", () => {
    const doc = JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Intro" }] },
        {
          type: "formBlock",
          attrs: {
            formId: "form-1",
            fields: [
              { id: "name", label: "Name", required: true },
              { id: "email", label: "Email", required: true },
            ],
          },
        },
      ],
    });

    expect(findFormBlockSchema([doc], "form-1")?.fields).toHaveLength(2);
  });

  it("reports required fields whose submitted value is empty", () => {
    const missing = missingRequiredFields(
      [
        { id: "name", label: "Full name", required: true },
        { id: "email", label: "Email", required: true },
        { id: "notes", label: "Notes", required: false },
      ],
      { name: "  ", email: "buyer@example.com" }
    );

    expect(missing).toEqual(["Full name"]);
  });
});

