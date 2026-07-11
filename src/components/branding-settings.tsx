"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Plus, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";
import {
  BACKGROUND_OPTIONS,
  DEPTH_OPTIONS,
  FONT_OPTIONS,
  FONT_PAIRINGS,
  RADIUS_OPTIONS,
  getFontStyle,
} from "@/lib/page-styles";
import { PRESET_COLORS } from "@/lib/color-palettes";
import { APP_NAME } from "@/lib/constants";
import { deriveBrandRamp } from "@/lib/pub-color";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

interface BrandKitState {
  primaryColor: string;
  secondaryColors: string[];
  logoUrl: string;
  font: string;
  headingFont: string;
  background: string;
  themeRadius: string;
  themeDepth: string;
  hideBranding: boolean;
}

interface BrandResponse {
  kit: BrandKitState;
  configured: boolean;
  isOwner: boolean;
  hideBrandingAllowed: boolean;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function BrandingSettings() {
  const [kit, setKit] = useState<BrandKitState | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [hideBrandingAllowed, setHideBrandingAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [newSwatch, setNewSwatch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchKit = useCallback(async () => {
    try {
      const data = await apiClient.get<BrandResponse>("/api/team/brand");
      setKit(data.kit);
      setIsOwner(data.isOwner);
      setHideBrandingAllowed(data.hideBrandingAllowed);
    } catch {
      toast.error("Failed to load brand kit");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKit();
  }, [fetchKit]);

  const patch = async (changes: Partial<BrandKitState>) => {
    if (!kit) return;
    const prev = kit;
    setKit({ ...kit, ...changes });
    setSaving(true);
    try {
      const data = await apiClient.patch<{ kit: BrandKitState }>("/api/team/brand", changes);
      setKit(data.kit);
    } catch (err) {
      setKit(prev);
      toast.error(err instanceof ApiError ? err.message : "Failed to save brand kit");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !kit) return;
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/team/brand/logo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? `Upload failed (${res.status})`);
        return;
      }
      setKit({ ...kit, logoUrl: data.url });
      toast.success("Brand logo updated");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!kit) return;
    const prev = kit;
    setKit({ ...kit, logoUrl: "" });
    try {
      const res = await fetch("/api/team/brand/logo", { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setKit(prev);
      toast.error("Failed to remove logo");
    }
  };

  const addSwatch = () => {
    if (!kit) return;
    const hex = newSwatch.startsWith("#") ? newSwatch : `#${newSwatch}`;
    if (!HEX_RE.test(hex)) {
      toast.error("Enter a 6-digit hex color");
      return;
    }
    if (kit.secondaryColors.length >= 6) return;
    setNewSwatch("");
    patch({ secondaryColors: [...kit.secondaryColors, hex.toLowerCase()] });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!kit) return null;

  const readOnly = !isOwner || saving;
  const previewBg = BACKGROUND_OPTIONS.find((b) => b.value === kit.background);
  const previewHeadingFont = getFontStyle(kit.headingFont || kit.font);
  const previewBodyFont = getFontStyle(kit.font);
  // Real derived ramp — the preview shows exactly what the published page computes
  const previewRamp = deriveBrandRamp(kit.primaryColor, previewBg?.hex ?? "");

  return (
    <div className="space-y-6">
      {!isOwner && (
        <Card className="p-4 text-sm text-muted-foreground">
          Only team owners can edit the brand kit. Changes below are disabled.
        </Card>
      )}

      {/* ── Live preview ── */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Brand preview</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            New pages start with these styles. Existing pages keep their own — use
            “Apply brand kit” in the editor to restyle one.
          </p>
        </div>
        {/* Mini published-page hero rendered from live kit state (user brand data) */}
        <div className="p-8" style={{ backgroundColor: previewBg?.hex, ...previewBodyFont }}>
          {kit.logoUrl && (
            <Image
              src={kit.logoUrl}
              alt="Brand logo"
              width={120}
              height={28}
              style={{ height: "28px", width: "auto", objectFit: "contain", marginBottom: "1rem" }}
            />
          )}
          <div
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: previewRamp.accentSafe,
              marginBottom: "0.5rem",
            }}
          >
            Proposal
          </div>
          <div
            style={{
              ...previewHeadingFont,
              fontSize: "1.75rem",
              fontWeight: 650,
              letterSpacing: "-0.02em",
              color: previewRamp.heading,
              marginBottom: "0.5rem",
            }}
          >
            Your next deal page
          </div>
          <div style={{ fontSize: "0.9375rem", color: previewRamp.body }}>
            Buyers see your brand on every page your team shares.
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span
              style={{
                display: "inline-block",
                padding: "8px 18px",
                background: kit.primaryColor,
                color: previewRamp.accentInk,
                borderRadius:
                  RADIUS_OPTIONS.find((r) => r.value === kit.themeRadius)?.sm ?? "8px",
                fontSize: "0.8125rem",
                fontWeight: 700,
              }}
            >
              Call to action
            </span>
            {kit.secondaryColors.map((c) => (
              <span
                key={c}
                className="inline-block h-5 w-5 rounded-full border border-border/50"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* ── Brand color ── */}
      <Card className="p-5 space-y-3">
        <SectionLabel>Brand color</SectionLabel>
        <div className="flex items-center gap-3">
          <label className="relative cursor-pointer flex-shrink-0 group" title="Pick brand color">
            <span
              className="block w-9 h-9 rounded-lg shadow-sm ring-1 ring-border transition-transform group-hover:scale-105"
              style={{ backgroundColor: kit.primaryColor }}
            />
            <input
              type="color"
              value={kit.primaryColor}
              disabled={readOnly}
              onChange={(e) => patch({ primaryColor: e.target.value })}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
              aria-label="Pick brand color"
            />
          </label>
          <code className="text-xs font-mono text-muted-foreground uppercase">
            {kit.primaryColor}
          </code>
        </div>
        <div className="grid grid-cols-12 gap-1.5 max-w-md">
          {PRESET_COLORS.map((hex) => (
            <button
              key={hex}
              title={hex}
              aria-label={`Brand color ${hex}`}
              aria-pressed={kit.primaryColor.toLowerCase() === hex.toLowerCase()}
              disabled={readOnly}
              onClick={() => patch({ primaryColor: hex })}
              style={{ backgroundColor: hex }}
              className={`aspect-square rounded-md border transition-all duration-150 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none ${
                kit.primaryColor.toLowerCase() === hex.toLowerCase()
                  ? "ring-2 ring-offset-1 ring-foreground border-transparent scale-110"
                  : "border-border/40"
              }`}
            />
          ))}
        </div>

        {/* Secondary swatches */}
        <SectionLabel className="pt-2">Secondary colors</SectionLabel>
        <div className="flex flex-wrap items-center gap-2">
          {kit.secondaryColors.map((c, i) => (
            <span key={`${c}-${i}`} className="relative group inline-block">
              <span
                className="block h-8 w-8 rounded-lg ring-1 ring-border"
                style={{ backgroundColor: c }}
                title={c}
              />
              {!readOnly && (
                <button
                  onClick={() =>
                    patch({ secondaryColors: kit.secondaryColors.filter((_, j) => j !== i) })
                  }
                  aria-label={`Remove ${c}`}
                  className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground items-center justify-center hidden group-hover:flex"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </span>
          ))}
          {!readOnly && kit.secondaryColors.length < 6 && (
            <span className="inline-flex items-center gap-1">
              <input
                type="text"
                value={newSwatch}
                onChange={(e) => setNewSwatch(e.target.value.replace(/[^#0-9a-fA-F]/g, "").slice(0, 7))}
                onKeyDown={(e) => e.key === "Enter" && addSwatch()}
                placeholder="#hex"
                className="w-20 px-2 py-1.5 text-xs font-mono rounded border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <Button variant="outline" size="sm" onClick={addSwatch} aria-label="Add color">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </span>
          )}
          {kit.secondaryColors.length === 0 && readOnly && (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Shown as quick swatches in the editor&apos;s color picker for everyone on the team.
        </p>
      </Card>

      {/* ── Logo ── */}
      <Card className="p-5 space-y-3">
        <SectionLabel>Brand logo</SectionLabel>
        {kit.logoUrl ? (
          <div className="flex items-center gap-3">
            <Image
              src={kit.logoUrl}
              alt="Brand logo"
              width={200}
              height={40}
              className="rounded border border-border object-contain bg-card px-2 py-1"
              style={{ height: "44px", width: "auto" }}
            />
            {!readOnly && (
              <Button variant="outline" size="sm" onClick={handleLogoRemove}>
                <X className="h-3.5 w-3.5 mr-1" /> Remove
              </Button>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={readOnly || logoUploading}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="h-3.5 w-3.5 mr-1.5" />
            {logoUploading ? "Uploading…" : "Upload logo"}
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleLogoUpload}
        />
        <p className="text-xs text-muted-foreground">
          PNG, JPEG, WebP or SVG, up to 2 MB. Placed at the top of new pages.
        </p>
      </Card>

      {/* ── Typography & page defaults ── */}
      <Card className="p-5 space-y-4">
        <div>
          <SectionLabel className="mb-2">Typography</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-w-lg">
            {FONT_PAIRINGS.map((pair) => {
              const isActive = kit.font === pair.body && kit.headingFont === pair.heading;
              return (
                <button
                  key={pair.id}
                  disabled={readOnly}
                  aria-pressed={isActive}
                  onClick={() => patch({ font: pair.body, headingFont: pair.heading })}
                  className={`px-2.5 py-2 rounded-lg border text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none ${
                    isActive
                      ? "border-foreground bg-accent text-accent-foreground"
                      : "border-border hover:bg-accent/50"
                  }`}
                >
                  <span
                    className="block text-sm font-semibold truncate"
                    style={getFontStyle(pair.heading || pair.body)}
                  >
                    {pair.label}
                  </span>
                  <span className="block text-3xs text-muted-foreground truncate">
                    {(FONT_OPTIONS.find((f) => f.value === (pair.heading || pair.body))?.label ??
                      "") +
                      " · " +
                      (FONT_OPTIONS.find((f) => f.value === pair.body)?.label ?? "")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionLabel className="mb-2">Default background</SectionLabel>
          <div className="flex gap-1.5">
            {BACKGROUND_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                title={opt.label}
                aria-label={`${opt.label} background`}
                aria-pressed={kit.background === opt.value}
                disabled={readOnly}
                onClick={() => patch({ background: opt.value })}
                style={{ backgroundColor: opt.hex }}
                className={`h-8 w-8 rounded-md border transition-all duration-150 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none ${
                  kit.background === opt.value
                    ? "ring-2 ring-offset-1 ring-foreground border-transparent scale-110"
                    : opt.dark
                      ? "border-border/20"
                      : "border-border"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <div>
            <SectionLabel className="mb-2">Corners</SectionLabel>
            <div className="flex gap-1">
              {RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  disabled={readOnly}
                  aria-pressed={kit.themeRadius === opt.value}
                  onClick={() => patch({ themeRadius: opt.value })}
                  className={`flex-1 py-1.5 text-xs rounded border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none ${
                    kit.themeRadius === opt.value
                      ? "border-foreground bg-accent text-accent-foreground"
                      : "border-border hover:bg-accent/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <SectionLabel className="mb-2">Depth</SectionLabel>
            <div className="flex gap-1">
              {DEPTH_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  disabled={readOnly}
                  aria-pressed={kit.themeDepth === opt.value}
                  onClick={() => patch({ themeDepth: opt.value })}
                  className={`flex-1 py-1.5 text-xs rounded border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none ${
                    kit.themeDepth === opt.value
                      ? "border-foreground bg-accent text-accent-foreground"
                      : "border-border hover:bg-accent/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── White-label ── */}
      <Card className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <SectionLabel>Hide {APP_NAME} branding</SectionLabel>
            <p className="text-xs text-muted-foreground mt-1">
              Removes the &quot;Powered by {APP_NAME}&quot; badge from your published pages.
            </p>
          </div>
          <input
            type="checkbox"
            checked={kit.hideBranding && hideBrandingAllowed}
            disabled={readOnly || !hideBrandingAllowed}
            onChange={(e) => patch({ hideBranding: e.target.checked })}
            aria-label={`Hide ${APP_NAME} branding`}
            className="h-4 w-4 mt-0.5 rounded border-border accent-primary disabled:opacity-50"
          />
        </div>
        {!hideBrandingAllowed && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning-subtle border border-warning/30">
            <Zap className="h-3.5 w-3.5 text-warning shrink-0" />
            <p className="text-xs text-warning-subtle-foreground">
              Upgrade to Pro to remove the {APP_NAME} badge from published pages.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
