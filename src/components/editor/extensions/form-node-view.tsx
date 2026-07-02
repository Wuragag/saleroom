"use client";

import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  X,
  Settings,
  FileText,
  Mail,
  Phone,
  User,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { FormField } from "@/types";

const PRESET_FIELDS: FormField[] = [
  { id: "name", type: "text", label: "Name", required: true, preset: true },
  { id: "email", type: "email", label: "Email", required: true, preset: true },
  { id: "phone", type: "phone", label: "Phone", required: false, preset: true },
  { id: "company", type: "text", label: "Company", required: false, preset: true },
];

const PRESET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  name: User,
  email: Mail,
  phone: Phone,
  company: Building2,
};

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Textarea" },
] as const;

export function FormNodeView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const [showSettings, setShowSettings] = useState(false);
  const fields: FormField[] = node.attrs.fields || [];
  const submitLabel: string = node.attrs.submitLabel || "Submit";
  const successMessage: string = node.attrs.successMessage || "Thank you!";

  const isPresetEnabled = (presetId: string) =>
    fields.some((f) => f.id === presetId);

  const togglePreset = (presetId: string) => {
    if (isPresetEnabled(presetId)) {
      updateAttributes({ fields: fields.filter((f) => f.id !== presetId) });
    } else {
      const preset = PRESET_FIELDS.find((p) => p.id === presetId)!;
      updateAttributes({ fields: [...fields, { ...preset }] });
    }
  };

  const addCustomField = () => {
    const id = `field_${Date.now()}`;
    updateAttributes({
      fields: [
        ...fields,
        { id, type: "text", label: "New Field", required: false },
      ],
    });
  };

  const updateField = (id: string, patch: Partial<FormField>) => {
    updateAttributes({
      fields: fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  };

  const removeField = (id: string) => {
    updateAttributes({ fields: fields.filter((f) => f.id !== id) });
  };

  return (
    <NodeViewWrapper
      data-type="form-block"
      className={selected ? "ring-2 ring-primary rounded-xl" : ""}
    >
      <div className="my-4 border border-dashed border-border rounded-xl p-5 bg-muted/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-primary" />
            Form Block
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Form settings"
            aria-pressed={showSettings}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Settings className="h-3.5 w-3.5" />
            {showSettings ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>

        {/* Preset field toggles */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Preset Fields
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_FIELDS.map((preset) => {
              const Icon = PRESET_ICONS[preset.id];
              const enabled = isPresetEnabled(preset.id);
              return (
                <button
                  key={preset.id}
                  onClick={() => togglePreset(preset.id)}
                  aria-pressed={enabled}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    enabled
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Field list */}
        {fields.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Fields
            </p>
            {fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  {field.preset ? (
                    <span className="text-sm font-medium">{field.label}</span>
                  ) : (
                    <Input
                      value={field.label}
                      onChange={(e) =>
                        updateField(field.id, { label: e.target.value })
                      }
                      className="h-7 text-sm border-none shadow-none p-0 focus-visible:ring-0"
                      placeholder="Field label"
                    />
                  )}
                </div>

                {!field.preset && (
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(field.id, {
                        type: e.target.value as FormField["type"],
                      })
                    }
                    className="text-xs bg-muted border border-border rounded px-1.5 py-1"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() =>
                    updateField(field.id, { required: !field.required })
                  }
                  aria-pressed={field.required}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    field.required
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {field.required ? "Required" : "Optional"}
                </button>

                <button
                  onClick={() => removeField(field.id)}
                  aria-label="Remove form"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add custom field */}
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg gap-1.5"
          onClick={addCustomField}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Custom Field
        </Button>

        {/* Settings panel */}
        {showSettings && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Submit Button Label
              </label>
              <Input
                value={submitLabel}
                onChange={(e) =>
                  updateAttributes({ submitLabel: e.target.value })
                }
                className="h-8 text-sm"
                placeholder="Submit"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Success Message
              </label>
              <Input
                value={successMessage}
                onChange={(e) =>
                  updateAttributes({ successMessage: e.target.value })
                }
                className="h-8 text-sm"
                placeholder="Thank you!"
              />
            </div>
          </div>
        )}

        {/* Preview */}
        {fields.length === 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            Toggle preset fields or add custom fields to build your form.
          </p>
        )}
      </div>
    </NodeViewWrapper>
  );
}
