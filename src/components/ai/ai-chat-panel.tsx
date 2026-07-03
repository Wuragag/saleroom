"use client";

import { useRef, useEffect, useState } from "react";
import { Sparkles, ArrowUp, ArrowUpRight } from "lucide-react";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { BuildProgressCard, type ProgressStep } from "./build-progress-card";
import { cn } from "@/lib/utils";

const MAX_PROMPT_LENGTH = 2000;

export type { ProgressStep };

export interface TextChatMessage {
  id: string;
  role: "user" | "assistant";
  kind?: "text";
  content: string;
  isError?: boolean;
  /** Follow-up action chips shown under the message (last message only). */
  suggestions?: string[];
}

export interface ProgressChatMessage {
  id: string;
  role: "assistant";
  kind: "progress";
  steps: ProgressStep[];
}

export type ChatMessage = TextChatMessage | ProgressChatMessage;

interface AiChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  generating: boolean;
  /** Contextual label for the working indicator (e.g. "Building your page…"). */
  generatingLabel: string;
  limitError: string | null;
  hasPage: boolean;
}

const SUGGESTIONS = [
  "A sales proposal for a B2B SaaS product",
  "A post-call recap with next steps and a CTA",
  "An onboarding page for a new customer",
];

/** Small AI avatar shown beside assistant messages. */
function AssistantAvatar() {
  return (
    <span className="gradient-ai mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm">
      <Sparkles className="h-3 w-3" />
    </span>
  );
}

export function AiChatPanel({
  messages,
  onSend,
  generating,
  generatingLabel,
  limitError,
  hasPage,
}: AiChatPanelProps) {
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keep the newest message in view
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, generating]);

  // Re-focus the input when a turn finishes
  useEffect(() => {
    if (!generating) inputRef.current?.focus();
  }, [generating]);

  const send = () => {
    const text = input.trim();
    if (!text || generating || limitError) return;
    setInput("");
    onSend(text);
  };

  const canSend = !!input.trim() && !generating && !limitError;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border/70 px-4 py-3.5">
        <span className="gradient-ai flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight text-foreground">Create with AI</p>
          <p className="text-2xs leading-tight text-muted-foreground">
            Describe your page — watch it build itself
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-5 pb-10 text-center">
            <span className="gradient-ai flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-foreground">
                What would you like to build?
              </p>
              <p className="text-xs text-muted-foreground">
                Start with a prompt, or pick an idea below.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  disabled={generating || !!limitError}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3.5 py-3 text-left text-xs font-medium text-foreground transition-all hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <span>{s}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;

          if (m.kind === "progress") {
            return (
              <div key={m.id} className="flex items-end gap-2 justify-start">
                <AssistantAvatar />
                <BuildProgressCard steps={m.steps} />
              </div>
            );
          }

          return (
            <div key={m.id} className="space-y-2">
              <div
                className={cn(
                  "flex items-end gap-2",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {m.role === "assistant" && !m.isError && <AssistantAvatar />}
                <div
                  className={cn(
                    "max-w-[82%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground shadow-sm"
                      : m.isError
                      ? "rounded-bl-md border border-destructive/20 bg-destructive/10 text-destructive"
                      : "rounded-bl-md border border-border/60 bg-card text-foreground shadow-sm"
                  )}
                >
                  {m.content}
                </div>
              </div>

              {/* Suggestion chips — last message only, not while generating */}
              {isLast &&
                !generating &&
                m.role === "assistant" &&
                !!m.suggestions?.length && (
                  <div className="flex flex-wrap gap-1.5 pl-8">
                    {m.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => onSend(s)}
                        disabled={!!limitError}
                        className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-all hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          );
        })}

        {/* Working indicator — hidden while a live progress card is the last message */}
        {generating && messages[messages.length - 1]?.kind !== "progress" && (
          <div className="flex items-end gap-2">
            <AssistantAvatar />
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border/60 bg-card px-3.5 py-2.5 shadow-sm">
              <span className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
              <span className="animate-pulse text-xs font-medium text-muted-foreground">
                {generatingLabel}
              </span>
            </div>
          </div>
        )}

        {limitError && <UpgradePrompt message={limitError} />}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border/70 p-3">
        <div className="rounded-2xl border border-border bg-white shadow-sm transition-shadow focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring/40">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={hasPage ? "Ask for a change…" : "Describe the page you want…"}
            rows={2}
            disabled={generating || !!limitError}
            aria-label="Message the AI"
            className="w-full resize-none bg-transparent px-3.5 pt-3 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
          />
          <div className="flex items-center justify-between px-2.5 pb-2.5">
            <span className="px-1 text-2xs text-muted-foreground">
              {hasPage ? "AI makes targeted edits — your other tabs stay put" : "Press Enter to send"}
            </span>
            <button
              onClick={send}
              disabled={!canSend}
              aria-label="Send message"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                canSend
                  ? "gradient-ai text-white shadow-sm hover:shadow-md"
                  : "bg-muted text-muted-foreground/50"
              )}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
