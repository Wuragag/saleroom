"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, Pencil, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareModal } from "@/components/share-modal";

interface PageAnalyticsActionsProps {
  pageId: string;
  slug: string;
  title: string;
  published: boolean;
  canShare: boolean;
}

export function PageAnalyticsActions({
  pageId,
  slug,
  title,
  published,
  canShare,
}: PageAnalyticsActionsProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const viewPath = published ? `/p/${slug}` : `/preview/${pageId}`;

  const copyLink = async () => {
    if (!published) {
      toast.info("Publish this page before copying a public link");
      return;
    }
    if (!canShare) {
      toast.info("You do not have permission to share this page");
      return;
    }

    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);

      fetch(`/api/pages/${pageId}/share`, { method: "POST" });
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <>
      <Button asChild variant="outline" size="sm" className="rounded-lg gap-1.5">
        <Link href={`/editor/${pageId}`}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>
      </Button>

      <Button asChild variant="outline" size="sm" className="rounded-lg gap-1.5">
        <Link href={viewPath} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-3.5 w-3.5" />
          {published ? "View" : "Preview"}
        </Link>
      </Button>

      <Button
        variant="outline"
        size="sm"
        className={`rounded-lg gap-1.5 ${
          copied ? "bg-success-subtle border-success/30 text-success-subtle-foreground" : ""
        }`}
        onClick={copyLink}
        disabled={!published || !canShare}
        title={
          !published
            ? "Publish this page to copy a public link"
            : canShare
            ? "Copy public link"
            : "You do not have permission to share this page"
        }
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </Button>

      <Button
        size="sm"
        className="rounded-lg gap-1.5"
        onClick={() => setShareOpen(true)}
        disabled={!published || !canShare}
        title={
          !published
            ? "Publish this page to share it"
            : canShare
            ? "Share this page"
            : "You do not have edit access to share this page"
        }
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </Button>

      {canShare && (
        <ShareModal
          open={shareOpen}
          onOpenChange={setShareOpen}
          pageId={pageId}
          slug={slug}
          pageTitle={title}
        />
      )}
    </>
  );
}
