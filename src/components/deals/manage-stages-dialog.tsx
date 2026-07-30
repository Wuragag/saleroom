"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { apiClient, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { stageDeleteTarget } from "@/lib/deals";
import type { PipelineStageData } from "@/types";

interface ManageStagesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stages: PipelineStageData[];
  /** Open-deal count per stage id — shown in the delete confirm. */
  dealCounts: Record<string, number>;
  onChanged: () => void;
}

function StageRow({
  stage,
  index,
  total,
  onRename,
  onMove,
  onDelete,
}: {
  stage: PipelineStageData;
  index: number;
  total: number;
  onRename: (name: string) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(stage.name);

  return (
    <div className="flex items-center gap-2 py-1.5">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          const trimmed = name.trim();
          if (!trimmed) {
            setName(stage.name);
            return;
          }
          if (trimmed !== stage.name) onRename(trimmed);
        }}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        aria-label={`Rename ${stage.name}`}
        className="h-8 flex-1 text-sm"
      />
      <IconButton
        aria-label={`Move ${stage.name} left`}
        size="sm"
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp />
      </IconButton>
      <IconButton
        aria-label={`Move ${stage.name} right`}
        size="sm"
        disabled={index === total - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown />
      </IconButton>
      <IconButton
        aria-label={`Delete ${stage.name}`}
        size="sm"
        disabled={total <= 1}
        onClick={onDelete}
      >
        <Trash2 />
      </IconButton>
    </div>
  );
}

export function ManageStagesDialog({
  isOpen,
  onClose,
  stages,
  dealCounts,
  onChanged,
}: ManageStagesDialogProps) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<PipelineStageData | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fail = (err: unknown, fallback: string) =>
    toast.error(err instanceof ApiError ? err.message : fallback);

  const rename = async (stage: PipelineStageData, name: string) => {
    try {
      await apiClient.patch(`/api/deals/stages/${stage.id}`, { name });
      onChanged();
    } catch (err) {
      fail(err, "Failed to rename column");
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const ids = stages.map((s) => s.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await apiClient.put("/api/deals/stages/reorder", { stageIds: ids });
      onChanged();
    } catch (err) {
      fail(err, "Failed to reorder columns");
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name || adding) return;
    setAdding(true);
    try {
      await apiClient.post("/api/deals/stages", { name });
      setNewName("");
      onChanged();
    } catch (err) {
      fail(err, "Failed to add column");
    } finally {
      setAdding(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const result = await apiClient.delete<{ moved: number; movedTo: string }>(
        `/api/deals/stages/${deleting.id}`
      );
      toast.success(
        result.moved > 0
          ? `Column deleted — ${result.moved} deal${result.moved === 1 ? "" : "s"} moved to ${result.movedTo}`
          : "Column deleted"
      );
      setDeleting(null);
      onChanged();
    } catch (err) {
      fail(err, "Failed to delete column");
    } finally {
      setDeleteBusy(false);
    }
  };

  const deleteTargetName = deleting
    ? stages.find((s) => s.id === stageDeleteTarget(stages, deleting.id))?.name
    : undefined;
  const deletingCount = deleting ? (dealCounts[deleting.id] ?? 0) : 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit columns</DialogTitle>
            <DialogDescription>
              Rename, reorder, add, or remove your pipeline&apos;s columns —
              changes apply to the whole team. Won and Lost are fixed.
            </DialogDescription>
          </DialogHeader>

          <div className="divide-y divide-border">
            {stages.map((stage, index) => (
              <StageRow
                key={stage.id}
                stage={stage}
                index={index}
                total={stages.length}
                onRename={(name) => rename(stage, name)}
                onMove={(direction) => move(index, direction)}
                onDelete={() => setDeleting(stage)}
              />
            ))}
          </div>

          <form onSubmit={add} className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New column name"
              aria-label="New column name"
              className="h-9 flex-1"
            />
            <Button type="submit" size="sm" disabled={!newName.trim() || adding} className="shrink-0">
              <Plus />
              {adding ? "Adding…" : "Add"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleting?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingCount > 0
                ? `${deletingCount} deal${deletingCount === 1 ? "" : "s"} in this column will move to "${deleteTargetName}". Nothing is lost.`
                : "This column is empty — nothing moves."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBusy ? "Deleting…" : "Delete column"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
