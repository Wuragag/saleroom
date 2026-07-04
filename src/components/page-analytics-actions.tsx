"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Pencil, Share2 } from "lucide-react";
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

  const viewPath = published ? `/p/${slug}` : `/preview/${pageId}`;

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
