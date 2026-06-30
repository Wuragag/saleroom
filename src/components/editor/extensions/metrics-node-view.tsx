"use client";

import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, Plus, Trash2 } from "lucide-react";

interface Metric {
  value: string;
  label: string;
}

export function MetricsNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>(node.attrs.metrics);

  const save = () => {
    updateAttributes({ metrics });
    setEditing(false);
  };

  const updateMetric = (index: number, field: keyof Metric, value: string) => {
    const next = [...metrics];
    next[index] = { ...next[index], [field]: value };
    setMetrics(next);
  };

  const addMetric = () => {
    if (metrics.length < 4) {
      setMetrics([...metrics, { value: "0", label: "Label" }]);
    }
  };

  const removeMetric = (index: number) => {
    if (metrics.length > 1) {
      setMetrics(metrics.filter((_, i) => i !== index));
    }
  };

  return (
    <NodeViewWrapper
      data-type="metrics"
      className={selected ? "ring-2 ring-primary rounded-xl" : ""}
    >
      {editing ? (
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          {metrics.map((metric, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                value={metric.value}
                onChange={(e) => updateMetric(i, "value", e.target.value)}
                placeholder="Value (e.g., 99%)"
                className="w-28"
              />
              <Input
                value={metric.label}
                onChange={(e) => updateMetric(i, "label", e.target.value)}
                placeholder="Label"
                className="flex-1"
              />
              {metrics.length > 1 && (
                <button
                  onClick={() => removeMetric(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {metrics.length < 4 && (
            <button
              onClick={addMetric}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" /> Add metric
            </button>
          )}
          <Button size="sm" onClick={save} className="w-full">
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Done
          </Button>
        </div>
      ) : (
        <div className="group relative my-2">
          <div
            className="rounded-xl border border-border bg-card/60 p-2"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${(node.attrs.metrics as Metric[]).length}, 1fr)`,
              gap: "2px",
            }}
          >
            {(node.attrs.metrics as Metric[]).map((metric, i) => (
              <div
                key={i}
                className="text-center py-5 px-3 rounded-lg"
                style={{ background: "color-mix(in srgb, var(--page-accent, #003B22) 8%, transparent)" }}
              >
                <div
                  className="text-2xl font-bold tracking-tight leading-none mb-1.5"
                  style={{ color: "var(--page-accent, #003B22)" }}
                >
                  {metric.value}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit metrics"
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity bg-muted/80 hover:bg-muted rounded-full p-1.5"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}
