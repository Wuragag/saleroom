"use client";

import { useRef, useState, useEffect } from "react";
import { ImagePlus, Lock, X, Zap } from "lucide-react";
import {
  FONT_OPTIONS,
  BACKGROUND_OPTIONS,
  WIDTH_OPTIONS,
  THEME_PRESETS,
  getAccentColor,
  type PageStyle,
} from "@/lib/page-styles";

// Curated preset palette — 12 colors, 6 per row
const PRESET_COLORS = [
  "#0f172a", // near-black
  "#1e40af", // deep blue
  "#2563eb", // blue
  "#7c3aed", // violet
  "#a21caf", // fuchsia
  "#e11d48", // rose
  "#f97316", // orange
  "#d97706", // amber
  "#16a34a", // green
  "#0d9488", // teal
  "#0891b2", // cyan
  "#64748b", // slate
];

interface StylePanelProps {
  style: PageStyle;
  onChange: (patch: Partial<PageStyle>) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  passwordProtection?: boolean;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
      {children}
    </p>
  );
}

export function StylePanel({ style, onChange, password, onPasswordChange, passwordProtection = true }: StylePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Color picker state
  const currentHex = getAccentColor(style.accentColor);
  const [hexInput, setHexInput] = useState(
    currentHex.replace("#", "").toUpperCase()
  );

  // Sync hex input when accent changes from outside (e.g. preset click)
  useEffect(() => {
    setHexInput(getAccentColor(style.accentColor).replace("#", "").toUpperCase());
  }, [style.accentColor]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ logoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="p-3 space-y-4">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        Style
      </h3>

      {/* Theme Presets */}
      <div>
        <SectionLabel>Theme</SectionLabel>
        <div className="grid grid-cols-3 gap-1">
          {THEME_PRESETS.map((preset) => {
            const bg = BACKGROUND_OPTIONS.find((b) => b.value === preset.background);
            const isActive =
              style.font === preset.font &&
              getAccentColor(style.accentColor) === preset.accentColor &&
              style.background === preset.background;
            return (
              <button
                key={preset.id}
                onClick={() =>
                  onChange({
                    font: preset.font,
                    accentColor: preset.accentColor,
                    background: preset.background,
                  })
                }
                className={`relative flex flex-col items-center gap-1 py-2 px-1 text-[10px] rounded-lg border transition-all ${
                  isActive
                    ? "border-foreground bg-accent text-accent-foreground ring-1 ring-foreground/20"
                    : "border-border hover:bg-accent/50"
                }`}
              >
                <div
                  className="w-full h-5 rounded border border-border/50 flex items-center justify-center"
                  style={{ backgroundColor: bg?.hex ?? "#fff" }}
                >
                  <div
                    className="w-3 h-1 rounded-full"
                    style={{ backgroundColor: preset.accentColor }}
                  />
                </div>
                <span className="font-medium truncate w-full text-center">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Logo */}
      <div>
        <SectionLabel>Logo</SectionLabel>
        {style.logoUrl ? (
          <div className="relative group inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={style.logoUrl}
              alt="Logo preview"
              className="h-10 max-w-full rounded border border-border object-contain bg-card px-1"
            />
            <button
              onClick={() => onChange({ logoUrl: "" })}
              className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove logo"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs rounded border border-dashed border-border hover:bg-accent/50 transition-colors text-muted-foreground"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Upload logo
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Font */}
      <div>
        <SectionLabel>Font</SectionLabel>
        <div className="grid grid-cols-2 gap-1">
          {FONT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ font: opt.value })}
              style={opt.style}
              className={`px-2 py-1 text-xs rounded border transition-colors text-left truncate ${
                style.font === opt.value
                  ? "border-foreground bg-accent text-accent-foreground"
                  : "border-border hover:bg-accent/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <SectionLabel>Color</SectionLabel>

        {/* Swatch trigger + hex input */}
        <div className="flex items-center gap-2 mb-2.5">
          {/* Color swatch — clicking opens native OS color picker */}
          <label
            className="relative cursor-pointer flex-shrink-0 group"
            title="Open color picker"
          >
            <div
              className="w-8 h-8 rounded-lg shadow-sm border-2 border-white ring-1 ring-border transition-transform group-hover:scale-110"
              style={{ backgroundColor: currentHex }}
            />
            <input
              type="color"
              value={currentHex}
              onChange={(e) => {
                const hex = e.target.value;
                setHexInput(hex.replace("#", "").toUpperCase());
                onChange({ accentColor: hex });
              }}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              aria-label="Pick custom color"
            />
          </label>

          {/* Hex text input */}
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono pointer-events-none select-none">
              #
            </span>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => {
                // Strip non-hex chars and cap at 6
                const val = e.target.value
                  .replace(/[^0-9a-fA-F]/g, "")
                  .slice(0, 6)
                  .toUpperCase();
                setHexInput(val);
                if (val.length === 6) {
                  onChange({ accentColor: `#${val}` });
                }
              }}
              onBlur={() => {
                // Revert to last valid hex on blur if incomplete
                if (hexInput.length !== 6) {
                  setHexInput(currentHex.replace("#", "").toUpperCase());
                }
              }}
              maxLength={6}
              spellCheck={false}
              placeholder="000000"
              className="w-full pl-6 pr-2 py-1.5 text-xs font-mono rounded border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/40 uppercase tracking-widest"
            />
          </div>
        </div>

        {/* Preset swatches — 6×2 grid */}
        <div className="grid grid-cols-6 gap-1.5">
          {PRESET_COLORS.map((hex) => {
            const isActive =
              currentHex.toLowerCase() === hex.toLowerCase();
            return (
              <button
                key={hex}
                title={hex}
                onClick={() => onChange({ accentColor: hex })}
                style={{ backgroundColor: hex }}
                className={`aspect-square rounded-md border transition-all duration-150 hover:scale-110 hover:shadow-sm ${
                  isActive
                    ? "ring-2 ring-offset-1 ring-foreground border-transparent scale-110"
                    : "border-white/30"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Layout width */}
      <div>
        <SectionLabel>Width</SectionLabel>
        <div className="flex gap-1">
          {WIDTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ layoutWidth: opt.value })}
              className={`flex-1 py-1 text-xs rounded border transition-colors ${
                style.layoutWidth === opt.value
                  ? "border-foreground bg-accent text-accent-foreground"
                  : "border-border hover:bg-accent/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Background */}
      <div>
        <SectionLabel>Background</SectionLabel>
        <div className="grid grid-cols-7 gap-1.5">
          {BACKGROUND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              title={opt.label}
              onClick={() => onChange({ background: opt.value })}
              style={{ backgroundColor: opt.hex }}
              className={`aspect-square rounded-md border transition-all duration-150 hover:scale-110 ${
                style.background === opt.value
                  ? "ring-2 ring-offset-1 ring-foreground border-transparent scale-110"
                  : opt.dark ? "border-white/20" : "border-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Tab placement */}
      <div>
        <SectionLabel>Tabs</SectionLabel>
        <div className="flex gap-1">
          {[
            { value: "top", label: "Top" },
            { value: "left", label: "Left" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ tabPlacement: opt.value })}
              className={`flex-1 py-1 text-xs rounded border transition-colors ${
                style.tabPlacement === opt.value
                  ? "border-foreground bg-accent text-accent-foreground"
                  : "border-border hover:bg-accent/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Page Access / Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <SectionLabel>Page Access</SectionLabel>
          {password && passwordProtection && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Protected
            </span>
          )}
        </div>
        {passwordProtection ? (
          <>
            <div className="relative">
              <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="Set a password…"
                className="w-full pl-6 pr-6 py-1.5 text-xs rounded border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/60"
              />
              {password && (
                <button
                  onClick={() => onPasswordChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Remove password"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground/70">
              {password ? "Visitors must enter this password." : "Leave blank for public access."}
            </p>
          </>
        ) : (
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <Zap className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-[10px] text-amber-800 dark:text-amber-200">
              Upgrade to Pro to protect pages with a password.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
