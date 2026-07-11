import { describe, it, expect } from "vitest";
import {
  getAnalyticsConfig,
  buildProviderRequest,
  buildBatchRequest,
  type AnalyticsConfig,
} from "@/lib/analytics-forwarder";

const posthog: AnalyticsConfig = {
  provider: "posthog",
  posthogKey: "phc_test",
  posthogHost: "https://us.i.posthog.com",
};

const mixpanel: AnalyticsConfig = {
  provider: "mixpanel",
  posthogHost: "https://us.i.posthog.com",
  mixpanelToken: "mp_test",
};

describe("getAnalyticsConfig", () => {
  it("is disabled when ANALYTICS_PROVIDER is unset", () => {
    expect(getAnalyticsConfig({})).toBeNull();
  });

  it("is disabled when the provider is set but the credential is missing", () => {
    expect(
      getAnalyticsConfig({ ANALYTICS_PROVIDER: "posthog" })
    ).toBeNull();
    expect(
      getAnalyticsConfig({ ANALYTICS_PROVIDER: "mixpanel" })
    ).toBeNull();
  });

  it("resolves posthog config, defaults the host, and trims trailing slashes", () => {
    const cfg = getAnalyticsConfig({
      ANALYTICS_PROVIDER: "PostHog",
      POSTHOG_KEY: "phc_x",
    });
    expect(cfg).toEqual({
      provider: "posthog",
      posthogKey: "phc_x",
      posthogHost: "https://us.i.posthog.com",
    });

    const eu = getAnalyticsConfig({
      ANALYTICS_PROVIDER: "posthog",
      POSTHOG_KEY: "phc_x",
      POSTHOG_HOST: "https://eu.i.posthog.com/",
    });
    expect(eu?.posthogHost).toBe("https://eu.i.posthog.com");
  });

  it("resolves mixpanel config", () => {
    const cfg = getAnalyticsConfig({
      ANALYTICS_PROVIDER: "mixpanel",
      MIXPANEL_TOKEN: "mp_x",
    });
    expect(cfg?.provider).toBe("mixpanel");
    expect(cfg?.mixpanelToken).toBe("mp_x");
  });
});

describe("buildProviderRequest", () => {
  it("no-ops when config is null or the event lacks identity", () => {
    expect(buildProviderRequest(null, { distinctId: "u1", event: "x" })).toBeNull();
    expect(buildProviderRequest(posthog, { distinctId: "", event: "x" })).toBeNull();
    expect(buildProviderRequest(posthog, { distinctId: "u1", event: "" })).toBeNull();
  });

  it("builds a PostHog capture request with api_key and properties", () => {
    const req = buildProviderRequest(posthog, {
      distinctId: "user_1",
      event: "page_published",
      properties: { pageId: "p1" },
      timestamp: "2026-07-11T00:00:00.000Z",
    });
    expect(req?.url).toBe("https://us.i.posthog.com/capture/");
    const body = JSON.parse(req!.body);
    expect(body).toMatchObject({
      api_key: "phc_test",
      event: "page_published",
      distinct_id: "user_1",
      properties: { pageId: "p1" },
      timestamp: "2026-07-11T00:00:00.000Z",
    });
  });

  it("suppresses PostHog person profiles for anonymous events", () => {
    const req = buildProviderRequest(posthog, {
      distinctId: "view_1",
      event: "page_view",
      anonymous: true,
    });
    const body = JSON.parse(req!.body);
    expect(body.properties.$process_person_profile).toBe(false);
  });

  it("does not set $process_person_profile for identified events", () => {
    const req = buildProviderRequest(posthog, { distinctId: "u1", event: "e" });
    const body = JSON.parse(req!.body);
    expect("$process_person_profile" in body.properties).toBe(false);
  });

  it("builds a Mixpanel track request with token, distinct_id, and epoch time", () => {
    const req = buildProviderRequest(mixpanel, {
      distinctId: "user_1",
      event: "page_published",
      properties: { pageId: "p1" },
      timestamp: "2026-07-11T00:00:00.000Z",
    });
    expect(req?.url).toBe("https://api.mixpanel.com/track");
    const body = JSON.parse(req!.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toMatchObject({
      event: "page_published",
      properties: {
        token: "mp_test",
        distinct_id: "user_1",
        pageId: "p1",
        time: Math.floor(Date.parse("2026-07-11T00:00:00.000Z") / 1000),
      },
    });
  });
});

describe("buildBatchRequest", () => {
  it("no-ops when disabled or every event lacks identity", () => {
    expect(buildBatchRequest(null, [{ distinctId: "u", event: "e" }])).toBeNull();
    expect(buildBatchRequest(posthog, [{ distinctId: "", event: "e" }])).toBeNull();
    expect(buildBatchRequest(posthog, [])).toBeNull();
  });

  it("drops identity-less events but keeps the rest (PostHog /batch)", () => {
    const req = buildBatchRequest(posthog, [
      { distinctId: "u1", event: "a" },
      { distinctId: "", event: "b" },
      { distinctId: "u2", event: "c" },
    ]);
    expect(req?.url).toBe("https://us.i.posthog.com/batch/");
    const body = JSON.parse(req!.body);
    expect(body.api_key).toBe("phc_test");
    expect(body.batch).toHaveLength(2);
    expect(body.batch.map((e: { event: string }) => e.event)).toEqual(["a", "c"]);
  });

  it("builds a Mixpanel array batch", () => {
    const req = buildBatchRequest(mixpanel, [
      { distinctId: "u1", event: "a" },
      { distinctId: "u2", event: "b" },
    ]);
    const body = JSON.parse(req!.body);
    expect(body).toHaveLength(2);
    expect(body[0].properties.token).toBe("mp_test");
  });
});
