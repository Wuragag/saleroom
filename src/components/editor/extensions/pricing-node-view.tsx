"use client";

import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, Plus, Trash2, Star } from "lucide-react";

interface Plan {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
}

export function PricingNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  const [plans, setPlans] = useState<Plan[]>(node.attrs.plans ?? []);

  const save = () => {
    updateAttributes({ plans });
    setEditing(false);
  };
  const update = (i: number, patch: Partial<Plan>) => {
    const next = [...plans];
    next[i] = { ...next[i], ...patch };
    setPlans(next);
  };
  const add = () => plans.length < 3 && setPlans([...plans, { name: "Plan", price: "$0", period: "/mo", features: ["Feature"], highlighted: false, ctaLabel: "Get started", ctaUrl: "#" }]);
  const remove = (i: number) => plans.length > 1 && setPlans(plans.filter((_, j) => j !== i));

  return (
    <NodeViewWrapper data-type="pricing" className={selected ? "ring-2 ring-primary rounded-xl" : ""}>
      {editing ? (
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-4">
          {plans.map((plan, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex gap-2">
                <Input value={plan.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Plan name" className="flex-1" />
                <Input value={plan.price} onChange={(e) => update(i, { price: e.target.value })} placeholder="$29" className="w-20" />
                <Input value={plan.period} onChange={(e) => update(i, { period: e.target.value })} placeholder="/mo" className="w-16" />
              </div>
              <textarea
                value={plan.features.join("\n")}
                onChange={(e) => update(i, { features: e.target.value.split("\n") })}
                placeholder="One feature per line"
                rows={3}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <div className="flex gap-2">
                <Input value={plan.ctaLabel ?? ""} onChange={(e) => update(i, { ctaLabel: e.target.value })} placeholder="CTA label" className="flex-1" />
                <Input value={plan.ctaUrl ?? ""} onChange={(e) => update(i, { ctaUrl: e.target.value })} placeholder="CTA URL" className="flex-1" />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={plan.highlighted} onChange={(e) => update(i, { highlighted: e.target.checked })} className="h-3.5 w-3.5 rounded border-border accent-primary" />
                  <Star className="h-3 w-3" /> Highlight this plan
                </label>
                {plans.length > 1 && (
                  <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {plans.length < 3 && (
            <button onClick={add} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="h-3 w-3" /> Add plan
            </button>
          )}
          <Button size="sm" onClick={save} className="w-full">
            <Check className="h-3.5 w-3.5 mr-1.5" /> Done
          </Button>
        </div>
      ) : (
        <div className="group relative">
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${plans.length}, 1fr)`, gap: "14px", margin: "1.5rem 0" }}>
            {plans.map((plan, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                  background: "var(--node-card-bg, #ffffff)",
                  border: plan.highlighted ? "2px solid var(--node-accent-safe, var(--page-accent, #64748b))" : "1px solid var(--node-card-border, rgba(0,0,0,0.08))",
                  borderRadius: "var(--pub-radius-md, 12px)",
                  boxShadow: plan.highlighted ? "var(--pub-shadow-md, 0 0 0 0 rgba(0,0,0,0))" : "var(--pub-shadow-sm, 0 0 0 0 rgba(0,0,0,0))",
                  padding: "26px 22px",
                }}
              >
                {plan.highlighted && (
                  <span style={{ position: "absolute", top: "-11px", left: "50%", transform: "translateX(-50%)", background: "var(--node-accent-safe, var(--page-accent, #64748b))", color: "var(--node-accent-ink, #fff)", fontSize: "11px", fontWeight: 700, padding: "3px 12px", borderRadius: "9999px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Recommended
                  </span>
                )}
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--node-text, #17171a)", marginBottom: "8px" }}>{plan.name}</div>
                <div style={{ marginBottom: "16px" }}>
                  <span style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--node-text, #17171a)" }}>{plan.price}</span>
                  <span style={{ fontSize: "14px", color: "var(--node-muted, #64748b)" }}>{plan.period}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                  {plan.features.filter(Boolean).map((f, j) => (
                    <div key={j} style={{ display: "flex", gap: "8px", fontSize: "14px", color: "var(--node-muted, #64748b)" }}>
                      <span style={{ color: "var(--node-accent-safe, #64748b)", fontWeight: 700 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>
                {plan.ctaLabel && (
                  <span
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "11px",
                      borderRadius: "var(--pub-radius-sm, 8px)",
                      fontWeight: 700,
                      fontSize: "14px",
                      ...(plan.highlighted
                        ? { background: "var(--node-accent-safe, var(--page-accent, #64748b))", color: "var(--node-accent-ink, #fff)" }
                        : { background: "transparent", border: "1px solid var(--node-accent-safe, #64748b)", color: "var(--node-accent-safe, #64748b)" }),
                    }}
                  >
                    {plan.ctaLabel}
                  </span>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit pricing"
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity bg-muted/80 hover:bg-muted rounded-full"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}
