"use client";

/**
 * SessionRecorder — records the buyer's session for replay via rrweb.
 *
 * Opt-in per page (Page.recordingEnabled). Mounted alongside
 * BuyerAnalyticsTracker only when the page owner has turned recording on.
 *
 * Privacy defaults (not configurable — deliberately conservative):
 *  - All text input values are masked (maskAllInputs).
 *  - Password fields are masked regardless (rrweb default).
 *
 * Events buffer and flush in chunks every ~20s and on tab-hide / pagehide.
 * The interval/backgrounding flush is awaitable: it re-buffers on transient
 * failure (rate-limit, network) so chunks aren't silently dropped, and stops
 * recording when the server reports the per-session cap or that recording was
 * turned off. Only the terminal unload flush uses keepalive (which the browser
 * size-caps), and by then just the small trailing buffer is left.
 */

import { useEffect, useRef } from "react";
import { record, type eventWithTime } from "rrweb";

const RECORDING_API = "/api/buyer/session";
const FIRST_FLUSH_DELAY_MS = 1_000;
const FLUSH_INTERVAL_MS = 20_000;
// Full DOM snapshot every 5 min, not every flush: GET concatenates all chunks
// into one stream, so a single initial snapshot replays the whole session —
// per-chunk checkouts would just bloat upload bandwidth and storage.
const CHECKOUT_INTERVAL_MS = 5 * 60_000;

interface Props {
  sessionId: string;
  /** Chunk index to start at — nonzero when appending to a resumed session. */
  startChunkIndex?: number;
}

export function SessionRecorder({ sessionId, startChunkIndex = 0 }: Props) {
  const bufferRef = useRef<eventWithTime[]>([]);
  const chunkIndexRef = useRef(startChunkIndex);

  useEffect(() => {
    if (!sessionId) return;
    chunkIndexRef.current = startChunkIndex;

    const url = `${RECORDING_API}/${sessionId}/recording`;
    let stopped = false;
    let sending = false;
    let firstFlushTimer: ReturnType<typeof setTimeout> | undefined;
    let flushTimer: ReturnType<typeof setInterval> | undefined;
    let recordStop: (() => void) | undefined;

    const stopRecording = () => {
      if (stopped) return;
      stopped = true;
      recordStop?.();
      recordStop = undefined;
      if (firstFlushTimer) {
        clearTimeout(firstFlushTimer);
        firstFlushTimer = undefined;
      }
      if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = undefined;
      }
    };

    // Awaitable flush (interval + backgrounding). Sends the current buffer,
    // and only drops events from the buffer once the server has accepted them.
    const flush = async () => {
      if (stopped || sending) return;
      const batch = bufferRef.current.slice();
      if (batch.length === 0) return;
      const chunkIndex = chunkIndexRef.current;
      sending = true;
      try {
        const res = await fetch(`${url}?c=${chunkIndex}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
        });
        if (res.ok) {
          bufferRef.current.splice(0, batch.length); // drop only what we sent
          chunkIndexRef.current += 1;
          const data = await res.json().catch(() => ({}));
          if (data?.capped) stopRecording(); // per-session length cap reached
        } else if (res.status === 404) {
          // Recording turned off or session gone — stop capturing and discard.
          bufferRef.current.length = 0;
          stopRecording();
        } else if (res.status === 429 || res.status >= 500) {
          // Transient — keep the buffer, don't advance the index, retry next tick.
        } else {
          // Other 4xx (413 too large, 400 malformed): non-retriable, drop it.
          bufferRef.current.splice(0, batch.length);
          chunkIndexRef.current += 1;
        }
      } catch {
        // Network error — keep buffered for the next flush.
      } finally {
        sending = false;
      }
    };

    // Terminal best-effort flush during page unload. keepalive survives the
    // teardown; the response can't be read, so no re-buffering.
    const flushFinal = () => {
      if (stopped) return;
      const events = bufferRef.current.splice(0);
      if (events.length === 0) return;
      const chunkIndex = chunkIndexRef.current++;
      try {
        fetch(`${url}?c=${chunkIndex}`, {
          method: "POST",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(events),
        }).catch(() => {/* non-critical */});
      } catch {/* ignore */}
    };

    recordStop = record({
      emit(event) {
        bufferRef.current.push(event);
      },
      maskAllInputs: true,
      blockClass: "sr-no-record",
      sampling: {
        mousemove: 100, // ms throttle — bounds event volume
        scroll: 200,
        input: "last", // only the final value per field, still masked
      },
      checkoutEveryNms: CHECKOUT_INTERVAL_MS,
    });

    // Save the initial full DOM snapshot quickly. Relying only on the 20s
    // interval means short visits often leave the large first snapshot to the
    // keepalive unload path, where browsers can size-cap the request.
    firstFlushTimer = setTimeout(() => {
      void flush();
    }, FIRST_FLUSH_DELAY_MS);

    flushTimer = setInterval(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") void flush();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flushFinal);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flushFinal);
      flushFinal(); // send whatever remains before tearing down
      stopRecording();
    };
  }, [sessionId, startChunkIndex]);

  return null;
}
