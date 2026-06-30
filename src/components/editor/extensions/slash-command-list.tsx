"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  Globe,
  ImageIcon,
  Minus,
  Table,
  MousePointerClick,
  LayoutGrid,
  Quote,
  FileText,
  UserRound,
  Blocks,
  Megaphone,
  BarChart3,
  SeparatorHorizontal,
  MessageSquareQuote,
} from "lucide-react";
import type { SlashCommandItem } from "./slash-command-suggestion";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  Globe,
  ImageIcon,
  Minus,
  Table,
  MousePointerClick,
  LayoutGrid,
  Quote,
  FileText,
  UserRound,
  Blocks,
  Megaphone,
  BarChart3,
  SeparatorHorizontal,
  MessageSquareQuote,
};

interface SlashCommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export const SlashCommandList = forwardRef(function SlashCommandList(
  { items, command }: SlashCommandListProps,
  ref
) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    optionRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const onKeyDown = useCallback(
    ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        const item = items[selectedIndex];
        if (item) command(item);
        return true;
      }
      return false;
    },
    [items, selectedIndex, command]
  );

  useImperativeHandle(ref, () => ({ onKeyDown }));

  if (items.length === 0) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm text-muted-foreground">
        No results
      </div>
    );
  }

  return (
    <div
      role="listbox"
      aria-label="Slash commands"
      aria-activedescendant={`slash-command-option-${selectedIndex}`}
      className="bg-popover border rounded-lg shadow-lg p-1 max-h-80 overflow-y-auto w-72"
    >
      {items.map((item, index) => {
        const Icon = ICON_MAP[item.icon];
        return (
          <button
            key={item.title}
            id={`slash-command-option-${index}`}
            ref={(el) => {
              optionRefs.current[index] = el;
            }}
            role="option"
            aria-selected={index === selectedIndex}
            type="button"
            onClick={() => command(item)}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-left transition-colors ${
              index === selectedIndex
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50"
            }`}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center">
              {Icon && <Icon className="h-4 w-4" />}
            </div>
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground">
                {item.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
});
