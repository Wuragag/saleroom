"use client";

import { useState } from "react";
import { Plus, Link2, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { SyncedBlockEditor } from "./synced-block-editor";
import type { BillingPlan } from "@/generated/prisma";

interface BlockItem {
  id: string;
  name: string;
  content: string;
  updatedAt: string;
  createdAt: string;
  createdBy: { name: string };
}

interface SyncedBlockLibraryProps {
  initialBlocks: BlockItem[];
  maxBlocks: number;
  plan: BillingPlan;
}

export function SyncedBlockLibrary({
  initialBlocks,
  maxBlocks,
  plan,
}: SyncedBlockLibraryProps) {
  const [blocks, setBlocks] = useState<BlockItem[]>(initialBlocks);
  const [editingBlock, setEditingBlock] = useState<BlockItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const canCreate =
    maxBlocks === -1 || blocks.length < maxBlocks;

  async function handleCreate() {
    if (!canCreate) {
      toast.error(
        maxBlocks === 0
          ? `Synced blocks are not available on the ${plan} plan. Upgrade to Pro or Team.`
          : `You've reached the limit of ${maxBlocks} synced blocks on the ${plan} plan.`
      );
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/synced-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled Block" }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create block");
        return;
      }

      const block = await res.json();
      const newBlock: BlockItem = {
        id: block.id,
        name: block.name,
        content: block.content,
        updatedAt: block.updatedAt,
        createdAt: block.createdAt,
        createdBy: block.createdBy,
      };
      setBlocks((prev) => [newBlock, ...prev]);
      setEditingBlock(newBlock);
    } catch {
      toast.error("Failed to create block");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/synced-blocks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete block");
        return;
      }
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      if (editingBlock?.id === id) setEditingBlock(null);
      toast.success("Block deleted");
    } catch {
      toast.error("Failed to delete block");
    } finally {
      setDeleting(null);
    }
  }

  function handleBlockUpdated(updated: Partial<BlockItem> & { id: string }) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
    );
    if (editingBlock?.id === updated.id) {
      setEditingBlock((prev) => (prev ? { ...prev, ...updated } : prev));
    }
  }

  // ── Editing view ──
  if (editingBlock) {
    return (
      <div>
        <button
          onClick={() => setEditingBlock(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </button>
        <SyncedBlockEditor
          block={editingBlock}
          onUpdate={handleBlockUpdated}
        />
      </div>
    );
  }

  // ── List view ──
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Content Library
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Create reusable content blocks that stay in sync across all your pages
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {creating ? "Creating..." : "New Block"}
        </button>
      </div>

      {/* Plan limit notice */}
      {maxBlocks === 0 && (
        <div className="mb-6 p-4 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
          Synced blocks are available on Pro and Team plans.{" "}
          <a href="/settings?tab=billing" className="font-medium underline">
            Upgrade now
          </a>
        </div>
      )}

      {blocks.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl">
          <Link2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            No synced blocks yet
          </p>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            Create a reusable block — like a security FAQ or team bios — and
            insert it into any page. Edit once, update everywhere.
          </p>
          {canCreate && (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Create your first block
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="group flex items-center gap-4 p-4 border rounded-xl bg-card hover:border-primary/30 hover:shadow-sm hover:bg-card/80 transition-all cursor-pointer"
              onClick={() => setEditingBlock(block)}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Link2 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{block.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  by {block.createdBy.name} · updated{" "}
                  {new Date(block.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this synced block? Pages using it will show a placeholder.")) {
                    handleDelete(block.id);
                  }
                }}
                disabled={deleting === block.id}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
