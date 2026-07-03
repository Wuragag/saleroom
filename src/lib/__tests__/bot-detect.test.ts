import { describe, it, expect } from "vitest";
import { isBotUserAgent } from "@/lib/bot-detect";

describe("isBotUserAgent", () => {
  it("flags common crawlers and preview fetchers", () => {
    const bots = [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0)",
      "Slackbot-LinkExpanding 1.0",
      "WhatsApp/2.19.81 A",
      "facebookexternalhit/1.1",
      "curl/8.4.0",
      "python-requests/2.31.0",
      "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/119.0",
      "axios/1.6.0",
    ];
    for (const ua of bots) expect(isBotUserAgent(ua), ua).toBe(true);
  });

  it("treats empty or missing UA as a bot", () => {
    expect(isBotUserAgent("")).toBe(true);
    expect(isBotUserAgent("   ")).toBe(true);
    expect(isBotUserAgent(null)).toBe(true);
    expect(isBotUserAgent(undefined)).toBe(true);
  });

  it("passes real browsers", () => {
    const real = [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
    ];
    for (const ua of real) expect(isBotUserAgent(ua), ua).toBe(false);
  });
});
