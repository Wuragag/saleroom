"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { ImagePlus, Lock, X, Zap } from "lucide-react";
import {
  FONT_OPTIONS,
  FONT_PAIRINGS,
  BACKGROUND_OPTIONS,
  WIDTH_OPTIONS,
  THEME_PRESETS,
  RADIUS_OPTIONS,
  DEPTH_OPTIONS,
  COVER_HEIGHTS,
  COVER_LAYOUTS,
  getAccentColor,
  getFontStyle,
  type PageStyle,
} from "@/lib/page-styles";
import { PRESET_COLORS } from "@/lib/color-palettes";
import { SectionLabel } from "@/components/ui/section-label";

interface StylePanelProps {
  style: PageStyle;
  onChange: (patch: Partial<PageStyle>) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  passwordProtection?: boolean;
  /** Whether the page currently has a cover image (shows the Cover controls) */
  hasCover?: boolean;
  /** Enables Blob logo upload via /api/pages/[id]/logo */
  pageId?: string;
}

interface TeamBrandKit {
  primaryColor: string;
  secondaryColors: string[];
  logoUrl: string;
  font: string;
  headingFont: string;
  background: string;
  themeRadius: string;
  themeDepth: string;
}

export function StylePanel({ style, onChange, password, onPasswordChange, passwordProtection = true, hasCover = false, pageId }: StylePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Team brand kit — brand swatches + one-click "Apply brand kit"
  const [brandKit, setBrandKit] = useState<TeamBrandKit | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/team/brand")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.configured && data.kit) setBrandKit(data.kit);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const applyBrandKit = () => {
    if (!brandKit) return;
    onChange({
      accentColor: brandKit.primaryColor,
      font: brandKit.font,
      headingFont: brandKit.headingFont,
      background: brandKit.background,
      themeRadius: brandKit.themeRadius,
      themeDepth: brandKit.themeDepth,
      ...(brandKit.logoUrl ? { logoUrl: brandKit.logoUrl } : {}),
    });
  };

  // Color picker state
  const currentHex = getAccentColor(style.accentColor);
  const [hexInput, setHexInput] = useState(
    currentHex.replace("#", "").toUpperCase()
  );

  // Sync hex input when accent changes from outside (e.g. preset click)
  useEffect(() => {
    setHexInput(getAccentColor(style.accentColor).replace("#", "").toUpperCase());
  }, [style.accentColor]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLogoError(null);

    // Upload to Blob storage; the URL persists through the normal style PUT.
    // (Logos used to be inlined as base64 data URLs — old values still render.)
    if (pageId) {
      setLogoUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/pages/${pageId}/logo`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          setLogoError(data?.error ?? `Upload failed (${res.status})`);
          return;
        }
        onChange({ logoUrl: data.url });
      } catch {
        setLogoError("Network error. Please try again.");
      } finally {
        setLogoUploading(false);
      }
      return;
    }

    // Fallback (no pageId in this context): inline data URL
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ logoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-3 space-y-4">
      <SectionLabel>Style</SectionLabel>

      {/* Team brand kit */}
      {brandKit && (
        <button
          onClick={applyBrandKit}
          className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-border hover:bg-accent/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span
              className="h-4 w-4 rounded-full ring-1 ring-border shrink-0"
              style={{ backgroundColor: brandKit.primaryColor }}
            />
            <span className="text-xs font-medium truncate">Apply brand kit</span>
          </span>
          <span className="text-3xs text-muted-foreground shrink-0">Team default</span>
        </button>
      )}

      {/* Theme Presets */}
      <div>
        <SectionLabel className="mb-1.5">Theme</SectionLabel>
        <div className="grid grid-cols-3 gap-1">
          {THEME_PRESETS.map((preset) => {
            const bg = BACKGROUND_OPTIONS.find((b) => b.value === preset.background);
            const isActive =
              style.font === preset.font &&
              style.headingFont === preset.headingFont &&
              getAccentColor(style.accentColor) === preset.accentColor &&
              style.background === preset.background;
            return (
              <button
                key={preset.id}
                aria-label={`${preset.label} theme`}
                aria-pressed={isActive}
                onClick={() =>
                  onChange({
                    font: preset.font,
                    headingFont: preset.headingFont,
                    accentColor: preset.accentColor,
                    background: preset.background,
                    themeRadius: preset.themeRadius,
                    themeDepth: preset.themeDepth,
                  })
                }
                className={`relative flex flex-col items-center gap-1 py-2 px-1 text-3xs rounded-lg border transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
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
        <SectionLabel className="mb-1.5">Logo</SectionLabel>
        {style.logoUrl ? (
          <div className="relative group inline-block">
            <Image
              src={style.logoUrl}
              alt="Logo preview"
              width={200}
              height={40}
              className="rounded border border-border object-contain bg-card px-1"
              style={{ height: "40px", width: "auto" }}
            />
            <button
              onClick={() => onChange({ logoUrl: "" })}
              className="absolute -top-2 -right-2 h-6 w-6 p-1 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              title="Remove logo"
              aria-label="Remove logo"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={logoUploading}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs rounded border border-dashed border-border hover:bg-accent/50 transition-colors text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {logoUploading ? "Uploading…" : "Upload logo"}
          </button>
        )}
        {logoError && <p className="mt-1 text-3xs text-destructive">{logoError}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Typography: curated heading/body pairings */}
      <div>
        <SectionLabel className="mb-1.5">Typography</SectionLabel>
        <div className="grid grid-cols-2 gap-1 mb-2">
          {FONT_PAIRINGS.map((pair) => {
            const isActive = style.font === pair.body && style.headingFont === pair.heading;
            const headingStyle = getFontStyle(pair.heading || pair.body);
            return (
              <button
                key={pair.id}
                aria-label={`${pair.label} font pairing`}
                aria-pressed={isActive}
                onClick={() => onChange({ font: pair.body, headingFont: pair.heading })}
                className={`px-2 py-1.5 rounded border transition-colors text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                  isActive
                    ? "border-foreground bg-accent text-accent-foreground"
                    : "border-border hover:bg-accent/50"
                }`}
              >
                <span className="block text-xs font-semibold truncate" style={headingStyle}>
                  {pair.label}
                </span>
                <span className="block text-3xs text-muted-foreground truncate">
                  {(FONT_OPTIONS.find((f) => f.value === (pair.heading || pair.body))?.label ?? "") +
                    " · " +
                    (FONT_OPTIONS.find((f) => f.value === pair.body)?.label ?? "")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Body font */}
        <SectionLabel className="mb-1.5">Body font</SectionLabel>
        <div className="grid grid-cols-2 gap-1 mb-2">
          {FONT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              aria-label={`${opt.label} font`}
              aria-pressed={style.font === opt.value}
              onClick={() => onChange({ font: opt.value })}
              style={opt.style}
              className={`px-2 py-1 text-xs rounded border transition-colors text-left truncate focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                style.font === opt.value
                  ? "border-foreground bg-accent text-accent-foreground"
                  : "border-border hover:bg-accent/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Heading font */}
        <SectionLabel className="mb-1.5">Heading font</SectionLabel>
        <select
          value={style.headingFont}
          onChange={(e) => onChange({ headingFont: e.target.value })}
          aria-label="Heading font"
          className="w-full px-2 py-1.5 text-xs rounded border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          <option value="">Same as body</option>
          {FONT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Color picker */}
      <div>
        <SectionLabel className="mb-1.5">Color</SectionLabel>

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

        {/* Brand swatches from the team brand kit */}
        {brandKit && (
          <div className="mb-2.5">
            <span className="block text-3xs font-medium text-muted-foreground mb-1">Brand</span>
            <div className="grid grid-cols-6 gap-1.5">
              {[brandKit.primaryColor, ...brandKit.secondaryColors].map((hex, i) => {
                const isActive = currentHex.toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={`${hex}-${i}`}
                    title={hex}
                    aria-label={`Brand color ${hex}`}
                    aria-pressed={isActive}
                    onClick={() => onChange({ accentColor: hex })}
                    style={{ backgroundColor: hex }}
                    className={`aspect-square rounded-md border transition-all duration-150 hover:scale-110 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                      isActive
                        ? "ring-2 ring-offset-1 ring-foreground border-transparent scale-110"
                        : "border-border/30"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Preset swatches — 6×2 grid */}
        <div className="grid grid-cols-6 gap-1.5">
          {PRESET_COLORS.map((hex) => {
            const isActive =
              currentHex.toLowerCase() === hex.toLowerCase();
            return (
              <button
                key={hex}
                title={hex}
                aria-label={`Accent color ${hex}`}
                aria-pressed={isActive}
                onClick={() => onChange({ accentColor: hex })}
                style={{ backgroundColor: hex }}
                className={`aspect-square rounded-md border transition-all duration-150 hover:scale-110 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
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
        <SectionLabel className="mb-1.5">Width</SectionLabel>
        <div className="flex gap-1">
          {WIDTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              aria-label={`${opt.label} width`}
              aria-pressed={style.layoutWidth === opt.value}
              onClick={() => onChange({ layoutWidth: opt.value })}
              className={`flex-1 py-1 text-xs rounded border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
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
        <SectionLabel className="mb-1.5">Background</SectionLabel>
        <div className="grid grid-cols-7 gap-1.5">
          {BACKGROUND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              title={opt.label}
              aria-label={`${opt.label} background`}
              aria-pressed={style.background === opt.value}
              onClick={() => onChange({ background: opt.value })}
              style={{ backgroundColor: opt.hex }}
              className={`aspect-square rounded-md border transition-all duration-150 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                style.background === opt.value
                  ? "ring-2 ring-offset-1 ring-foreground border-transparent scale-110"
                  : opt.dark ? "border-white/20" : "border-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Corners */}
      <div>
        <SectionLabel className="mb-1.5">Corners</SectionLabel>
        <div className="flex gap-1">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              aria-label={`${opt.label} corners`}
              aria-pressed={style.themeRadius === opt.value}
              onClick={() => onChange({ themeRadius: opt.value })}
              className={`flex-1 py-1 text-xs rounded border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                style.themeRadius === opt.value
                  ? "border-foreground bg-accent text-accent-foreground"
                  : "border-border hover:bg-accent/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Depth */}
      <div>
        <SectionLabel className="mb-1.5">Depth</SectionLabel>
        <div className="flex gap-1">
          {DEPTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              aria-label={`${opt.label} depth`}
              aria-pressed={style.themeDepth === opt.value}
              onClick={() => onChange({ themeDepth: opt.value })}
              className={`flex-1 py-1 text-xs rounded border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                style.themeDepth === opt.value
                  ? "border-foreground bg-accent text-accent-foreground"
                  : "border-border hover:bg-accent/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cover — only when a cover image is set */}
      {hasCover && (
        <div>
          <SectionLabel className="mb-1.5">Cover</SectionLabel>
          <div className="flex gap-1 mb-1.5">
            {COVER_LAYOUTS.map((opt) => (
              <button
                key={opt.value}
                aria-label={`${opt.label} cover layout`}
                aria-pressed={style.coverLayout === opt.value}
                onClick={() => onChange({ coverLayout: opt.value })}
                className={`flex-1 py-1 text-xs rounded border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                  style.coverLayout === opt.value
                    ? "border-foreground bg-accent text-accent-foreground"
                    : "border-border hover:bg-accent/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {COVER_HEIGHTS.map((opt) => (
              <button
                key={opt.value}
                aria-label={`${opt.label} cover height`}
                aria-pressed={style.coverHeight === opt.value}
                onClick={() => onChange({ coverHeight: opt.value })}
                className={`flex-1 py-1 text-xs rounded border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                  style.coverHeight === opt.value
                    ? "border-foreground bg-accent text-accent-foreground"
                    : "border-border hover:bg-accent/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {style.coverLayout === "overlay" && (
            <p className="mt-1 text-3xs text-muted-foreground/70">
              Title and subtitle render on the cover on the published page.
            </p>
          )}
        </div>
      )}

      {/* Tab placement */}
      <div>
        <SectionLabel className="mb-1.5">Tabs</SectionLabel>
        <div className="flex gap-1">
          {[
            { value: "top", label: "Top" },
            { value: "left", label: "Left" },
          ].map((opt) => (
            <button
              key={opt.value}
              aria-label={`${opt.label} tab placement`}
              aria-pressed={style.tabPlacement === opt.value}
              onClick={() => onChange({ tabPlacement: opt.value })}
              className={`flex-1 py-1 text-xs rounded border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
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
            <span className="text-3xs font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  title="Remove password"
                  aria-label="Remove password"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <p className="mt-1 text-3xs text-muted-foreground/70">
              {password ? "Visitors must enter this password." : "Leave blank for public access."}
            </p>
          </>
        ) : (
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-warning-subtle border border-warning/30">
            <Zap className="h-3 w-3 text-warning shrink-0" />
            <p className="text-3xs text-warning-subtle-foreground">
              Upgrade to Pro to protect pages with a password.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
