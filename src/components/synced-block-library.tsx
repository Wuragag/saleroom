"use client";

import { useState } from "react";
import { Plus, Link2, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";
import { SyncedBlockEditor } from "./synced-block-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { UpgradePrompt } from "@/components/upgrade-prompt";
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
  const [pendingDelete, setPendingDelete] = useState<BlockItem | null>(null);

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
      const block = await apiClient.post<BlockItem>("/api/synced-blocks", { name: "Untitled Block" });
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
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create block");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await apiClient.delete(`/api/synced-blocks/${id}`);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      if (editingBlock?.id === id) setEditingBlock(null);
      toast.success("Block deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete block");
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
      <PageHeader
        title="Content Library"
        description="Create reusable content blocks that stay in sync across all your pages"
        className="mb-6"
        actions={
          <Button onClick={handleCreate} disabled={creating}>
            <Plus className="h-4 w-4" />
            {creating ? "Creating..." : "New Block"}
          </Button>
        }
      />

      {/* Plan limit notice */}
      {maxBlocks === 0 && (
        <div className="mb-6">
          <UpgradePrompt message="Synced blocks are available on Pro and Team plans." />
        </div>
      )}

      {blocks.length === 0 ? (
        <div className="border border-dashed rounded-xl">
          <EmptyState
            icon={Link2}
            title="No synced blocks yet"
            description="Create a reusable block — like a security FAQ or team bios — and insert it into any page. Edit once, update everywhere."
            action={
              canCreate ? (
                <Button onClick={handleCreate} disabled={creating}>
                  <Plus className="h-4 w-4" />
                  Create your first block
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid gap-3">
          {blocks.map((block) => (
            <div
              key={block.id}
              role="button"
              tabIndex={0}
              onClick={() => setEditingBlock(block)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setEditingBlock(block);
                }
              }}
              className="group flex items-center gap-4 p-4 border rounded-xl bg-card hover:border-primary/30 hover:shadow-sm hover:bg-card/80 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Link2 className="h-5 w-5 text-primary" />
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
                  setPendingDelete(block);
                }}
                disabled={deleting === block.id}
                aria-label={`Delete ${block.name}`}
                className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this synced block?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? (
                <>
                  &ldquo;{pendingDelete.name}&rdquo; will be deleted. Pages using
                  it will show a placeholder.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => {
                if (pendingDelete) handleDelete(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
