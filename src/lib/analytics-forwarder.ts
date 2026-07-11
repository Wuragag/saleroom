/**
 * Provider-agnostic server-side analytics forwarding.
 *
 * Analytics events already land in Postgres via the `/api/analytics/*` and
 * `/api/buyer/*` write endpoints (see `docs/FEATURES.md` → Analytics). This
 * module *mirrors* selected events to an external product-analytics provider
 * (PostHog by default; Mixpanel also supported) so funnels, retention, and
 * cohort analysis can be built without re-deriving them from raw rows.
 *
 * Why server-side (not a client SDK on the buyer page):
 *  - The buyer surface is CSP-hardened (`next.config.mjs`); a client SDK means
 *    loosening `script-src`/`connect-src` on a page we deliberately keep tight.
 *  - No ad-blocker loss — buyer engagement is the product, so we can't afford to
 *    drop 20-40% of it to blockers.
 *  - Events are enriched with server-known identity that a client SDK can't see
 *    or would re-derive worse: visitorHash, contactId, engagement score, intent.
 *
 * Safety contract:
 *  - Disabled by default. If `ANALYTICS_PROVIDER` is unset (or the matching key
 *    is missing) every function is a silent no-op, so this is safe to deploy
 *    dark and flip on later with an env change alone.
 *  - `trackEvent`/`trackEvents` never throw and never block the response path —
 *    callers fire them via `after()`. A provider outage can't break a request.
 *  - `buildProviderRequest`/`buildBatchRequest` are pure (no I/O, no clock) and
 *    unit-tested; the network send is the only impure part.
 *
 * Env:
 *   ANALYTICS_PROVIDER   "posthog" | "mixpanel"  (unset ⇒ forwarding disabled)
 *   POSTHOG_KEY          PostHog project API key (write-only ingest key)
 *   POSTHOG_HOST         PostHog ingest host (default https://us.i.posthog.com)
 *   MIXPANEL_TOKEN       Mixpanel project token
 */

export type AnalyticsProvider = "posthog" | "mixpanel";

export interface AnalyticsEvent {
  /**
   * Stable identity for the actor. Use the rep's `userId` for product-usage
   * events and the buyer's `visitorHash` for buyer-intelligence events. For
   * fully anonymous streams (raw page views) pass a synthetic id and set
   * `anonymous: true` so no person profile is created.
   */
  distinctId: string;
  /** Event name, e.g. "page_published", "buyer_cta_click". */
  event: string;
  /** Arbitrary event properties. Keep these free of raw PII. */
  properties?: Record<string, unknown>;
  /** Anonymous events must not create or merge a person profile. */
  anonymous?: boolean;
  /** ISO-8601 timestamp. Omit to let the provider stamp ingestion time. */
  timestamp?: string;
}

export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  posthogKey?: string;
  posthogHost: string;
  mixpanelToken?: string;
}

export interface ProviderRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

/** How long we wait on a provider before giving up (never hangs a request). */
const SEND_TIMEOUT_MS = 3000;

/**
 * Resolve provider config from the environment. Returns `null` when forwarding
 * is disabled or the selected provider is missing its credential — callers
 * treat `null` as "do nothing".
 */
export function getAnalyticsConfig(
  env: Record<string, string | undefined> = process.env
): AnalyticsConfig | null {
  const provider = env.ANALYTICS_PROVIDER?.trim().toLowerCase();

  if (provider === "posthog") {
    if (!env.POSTHOG_KEY) return null;
    return {
      provider: "posthog",
      posthogKey: env.POSTHOG_KEY,
      posthogHost: (env.POSTHOG_HOST?.trim() || DEFAULT_POSTHOG_HOST).replace(/\/+$/, ""),
    };
  }

  if (provider === "mixpanel") {
    if (!env.MIXPANEL_TOKEN) return null;
    return {
      provider: "mixpanel",
      posthogHost: DEFAULT_POSTHOG_HOST, // unused for mixpanel; keeps the type total
      mixpanelToken: env.MIXPANEL_TOKEN,
    };
  }

  return null;
}

// ---- Per-provider event payloads (pure) ----

function posthogEventPayload(event: AnalyticsEvent): Record<string, unknown> {
  const properties: Record<string, unknown> = { ...(event.properties ?? {}) };
  // Suppress person-profile creation for anonymous streams so unique-user
  // counts aren't inflated by throwaway ids (raw page views, link clicks).
  if (event.anonymous) properties.$process_person_profile = false;

  const payload: Record<string, unknown> = {
    event: event.event,
    distinct_id: event.distinctId,
    properties,
  };
  if (event.timestamp) payload.timestamp = event.timestamp;
  return payload;
}

function mixpanelEventPayload(
  config: AnalyticsConfig,
  event: AnalyticsEvent
): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    token: config.mixpanelToken,
    distinct_id: event.distinctId,
    ...(event.properties ?? {}),
  };
  if (event.timestamp) {
    const ms = Date.parse(event.timestamp);
    if (!Number.isNaN(ms)) properties.time = Math.floor(ms / 1000);
  }
  return { event: event.event, properties };
}

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

/**
 * Build the HTTP request for a single event, or `null` when forwarding is
 * disabled / the event has no identity. Pure — no I/O, no clock.
 */
export function buildProviderRequest(
  config: AnalyticsConfig | null,
  event: AnalyticsEvent
): ProviderRequest | null {
  if (!config || !event.distinctId || !event.event) return null;

  if (config.provider === "posthog") {
    return {
      url: `${config.posthogHost}/capture/`,
      headers: JSON_HEADERS,
      body: JSON.stringify({ api_key: config.posthogKey, ...posthogEventPayload(event) }),
    };
  }

  // mixpanel — /track accepts a JSON array of events
  return {
    url: "https://api.mixpanel.com/track",
    headers: JSON_HEADERS,
    body: JSON.stringify([mixpanelEventPayload(config, event)]),
  };
}

/**
 * Build a single batched HTTP request for many events, or `null` when disabled
 * / the batch is empty after dropping identity-less events. Pure.
 */
export function buildBatchRequest(
  config: AnalyticsConfig | null,
  events: AnalyticsEvent[]
): ProviderRequest | null {
  if (!config) return null;
  const valid = events.filter((e) => e.distinctId && e.event);
  if (valid.length === 0) return null;

  if (config.provider === "posthog") {
    return {
      url: `${config.posthogHost}/batch/`,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        api_key: config.posthogKey,
        batch: valid.map(posthogEventPayload),
      }),
    };
  }

  // mixpanel — /track already takes an array of events
  return {
    url: "https://api.mixpanel.com/track",
    headers: JSON_HEADERS,
    body: JSON.stringify(valid.map((e) => mixpanelEventPayload(config, e))),
  };
}

// ---- Network send (impure, never throws) ----

async function send(req: ProviderRequest, provider: AnalyticsProvider): Promise<void> {
  try {
    const res = await fetch(req.url, {
      method: "POST",
      headers: req.headers,
      body: req.body,
      // A slow/unreachable provider must never hold up the response path.
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[analytics-forwarder] ${provider} responded ${res.status}`);
    }
  } catch (err) {
    console.error("[analytics-forwarder] send failed", err);
  }
}

/**
 * Fire a single event to the configured provider. No-op when disabled. Never
 * throws. Call from within `after(() => trackEvent(...))` so it runs off the
 * response path.
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  const config = getAnalyticsConfig();
  const req = buildProviderRequest(config, event);
  if (!req || !config) return;
  await send(req, config.provider);
}

/**
 * Fire many events in one batched request. No-op when disabled or empty. Never
 * throws.
 */
export async function trackEvents(events: AnalyticsEvent[]): Promise<void> {
  const config = getAnalyticsConfig();
  const req = buildBatchRequest(config, events);
  if (!req || !config) return;
  await send(req, config.provider);
}
