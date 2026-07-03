"use client";

/**
 * SessionReplayPlayer — fetches a recorded session's events and renders them
 * with rrweb-player. Mounted inside a modal from the buyer analytics panel.
 *
 * The rrweb-player container div is always in the DOM (states are drawn as an
 * overlay) so the ref exists when the player attaches after the async load.
 * rrweb-player is a Svelte component, so teardown uses $destroy().
 */

import { useEffect, useRef, useState } from "react";
import { Loader2, Video } from "lucide-react";
// Static import so Next.js's CSS pipeline bundles it — this component only
// ever loads inside the (dashboard-only) buyer analytics panel.
import "rrweb-player/dist/style.css";

interface Props {
  sessionId: string;
}

type LoadState = "loading" | "empty" | "ready" | "error";

export function SessionReplayPlayer({ sessionId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<{ $destroy?: () => void } | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let cancelled = false;
    setState("loading");

    async function load() {
      try {
        const res = await fetch(`/api/buyer/session/${sessionId}/recording`);
        if (!res.ok) throw new Error("Failed to load recording");
        const data = await res.json();
        const events = Array.isArray(data.events) ? data.events : [];

        if (cancelled) return;
        if (events.length < 2) {
          setState("empty");
          return;
        }

        const { default: Player } = await import("rrweb-player");
        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = "";
        const player = new Player({
          target: containerRef.current,
          props: {
            events,
            width: Math.min(900, containerRef.current.clientWidth || 900),
            height: 520,
            autoPlay: true,
            showController: true,
          },
        });
        playerRef.current = player as unknown as { $destroy?: () => void };
        setState("ready");
      } catch (err) {
        console.error("[SessionReplayPlayer]", err);
        if (!cancelled) setState("error");
      }
    }

    load();
    return () => {
      cancelled = true;
      // Svelte teardown — releases the Replayer, its iframe, listeners, timers
      playerRef.current?.$destroy?.();
      playerRef.current = null;
    };
  }, [sessionId]);

  return (
    <div className="relative min-h-[400px]">
      {/* Always mounted so containerRef exists when the player attaches. */}
      <div ref={containerRef} className="rrweb-replay-container flex justify-center" />

      {state !== "ready" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          {state === "loading" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading replay…</span>
            </>
          )}
          {state === "empty" && (
            <>
              <Video className="h-6 w-6" />
              <p className="text-sm">No replay recorded for this session yet.</p>
            </>
          )}
          {state === "error" && (
            <p className="text-sm text-destructive">Couldn&apos;t load this replay.</p>
          )}
        </div>
      )}
    </div>
  );
}
