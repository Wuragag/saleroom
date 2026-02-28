"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PageLink } from "@/types";

interface LinksEditorProps {
  links: PageLink[];
  onChange: (links: PageLink[]) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function LinksEditor({ links, onChange }: LinksEditorProps) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const addLink = () => {
    if (!newLabel.trim() || !newUrl.trim()) return;
    const url = newUrl.startsWith("http") ? newUrl : `https://${newUrl}`;
    onChange([...links, { id: generateId(), label: newLabel.trim(), url }]);
    setNewLabel("");
    setNewUrl("");
    setAdding(false);
  };

  const removeLink = (id: string) => {
    onChange(links.filter((l) => l.id !== id));
  };

  const updateLink = (id: string, patch: Partial<PageLink>) => {
    onChange(links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Links
        </h3>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Add link"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Existing links */}
      <div className="space-y-1.5">
        {links.map((link) => (
          <div key={link.id} className="group flex items-start gap-1.5">
            <GripVertical className="h-3.5 w-3.5 mt-1.5 text-muted-foreground/40 flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-0.5">
              <input
                value={link.label}
                onChange={(e) => updateLink(link.id, { label: e.target.value })}
                onBlur={() => {
                  // trigger save on blur is handled by parent debounce
                }}
                placeholder="Label"
                className="w-full text-xs px-1.5 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                value={link.url}
                onChange={(e) => updateLink(link.id, { url: e.target.value })}
                placeholder="https://"
                className="w-full text-xs px-1.5 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring text-muted-foreground"
              />
            </div>
            <button
              onClick={() => removeLink(link.id)}
              className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new link form */}
      {adding && (
        <div className="space-y-1.5 pt-1">
          <input
            autoFocus
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (e.g. Website)"
            className="w-full text-xs px-1.5 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://"
            onKeyDown={(e) => {
              if (e.key === "Enter") addLink();
              if (e.key === "Escape") setAdding(false);
            }}
            className="w-full text-xs px-1.5 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring text-muted-foreground"
          />
          <div className="flex gap-1">
            <Button size="sm" className="h-6 text-xs flex-1" onClick={addLink}>
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs flex-1"
              onClick={() => {
                setAdding(false);
                setNewLabel("");
                setNewUrl("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {links.length === 0 && !adding && (
        <p className="text-[10px] text-muted-foreground">
          No links yet. Click + to add one.
        </p>
      )}
    </div>
  );
}
