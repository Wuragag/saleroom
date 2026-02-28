"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function AcceptInviteCard({
  token,
  teamName,
  inviterName,
}: {
  token: string;
  teamName: string;
  inviterName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { update } = useSession();

  async function handleAccept() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/team/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to accept invite");
        setLoading(false);
        return;
      }

      // Refresh session to pick up new team membership
      await update();
      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm w-full bg-card border border-border rounded-xl p-8 text-center">
      <h1 className="text-lg font-semibold text-foreground mb-2">
        Join {teamName}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {inviterName} invited you to join <strong>{teamName}</strong> on
        SalesRoom.
      </p>

      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold h-10 px-4 hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Joining..." : "Accept invitation"}
      </button>
    </div>
  );
}
