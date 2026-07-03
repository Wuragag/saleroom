/**
 * Lightweight bot detection by User-Agent, used to keep crawlers and
 * link-preview fetchers out of analytics. An empty/missing UA counts as a bot
 * — real browsers always send one.
 */

const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|prerender|preview|facebookexternalhit|whatsapp|telegram|linkedin|slack|discord|twitter|pinterest|embedly|quora|vkshare|bitly|curl|wget|python-requests|python-urllib|aiohttp|httpx|axios|go-http-client|okhttp|java\/|libwww|phantomjs|puppeteer|playwright/i;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.trim() === "") return true;
  return BOT_UA_PATTERN.test(userAgent);
}
