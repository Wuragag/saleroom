/**
 * Every cookie and browser-storage key the product sets, verified against the
 * source (see docs/FEATURES.md → Privacy). Keep this table in step with the
 * code: the cookie notice renders it directly.
 */
export type StorageKind = "cookie" | "localStorage"
export type StorageCategory = "necessary" | "functional" | "analytics"

export interface StorageEntry {
  name: string
  kind: StorageKind
  /** Where it is set. */
  surface: "Marketing site" | "App (signed-in)" | "Buyer page (/p/…)" | "All"
  purpose: string
  /** Human lifetime. */
  lifetime: string
  category: StorageCategory
  /** Does it identify a person or device? */
  identifies: boolean
}

export const STORAGE_ENTRIES: StorageEntry[] = [
  {
    name: "authjs.session-token (or __Secure-authjs.session-token)",
    kind: "cookie",
    surface: "App (signed-in)",
    purpose: "Keeps you signed in. Holds a signed session token with your user id, team and plan.",
    lifetime: "30 days, or until you sign out",
    category: "necessary",
    identifies: true,
  },
  {
    name: "authjs.csrf-token, authjs.callback-url",
    kind: "cookie",
    surface: "All",
    purpose: "Protects sign-in forms against cross-site request forgery and returns you to the page you came from. Set by the sign-in library on first load; contains a random token, nothing about you.",
    lifetime: "Session",
    category: "necessary",
    identifies: false,
  },
  {
    name: "page_auth_{pageId}",
    kind: "cookie",
    surface: "Buyer page (/p/…)",
    purpose: "Remembers that you entered the correct password for a protected page. Contains a signed page token, nothing about you.",
    lifetime: "24 hours",
    category: "necessary",
    identifies: false,
  },
  {
    name: "db_ref_{pageId}",
    kind: "cookie",
    surface: "Buyer page (/p/…)",
    purpose: "Set when you open a personal link sent to you, or pass an email gate. Lets the sender see that it was you who read the page.",
    lifetime: "30 days",
    category: "analytics",
    identifies: true,
  },
  {
    name: "db_visitor_id",
    kind: "localStorage",
    surface: "Buyer page (/p/…)",
    purpose: "A random identifier generated in your browser so the sender can tell a return visit from a new one. It is hashed together with the page id before it is stored, so the same browser looks different on every page.",
    lifetime: "Until you clear site data",
    category: "analytics",
    identifies: true,
  },
  {
    name: "db_privacy_notice_{pageId}",
    kind: "localStorage",
    surface: "Buyer page (/p/…)",
    purpose: "Remembers that you dismissed the reading notice on a page.",
    lifetime: "Until you clear site data",
    category: "functional",
    identifies: false,
  },
  {
    name: "db_replay_consent_{pageId}",
    kind: "localStorage",
    surface: "Buyer page (/p/…)",
    purpose: "Your answer to the session-replay request (allowed or declined) on a page that has replay switched on.",
    lifetime: "Until you clear site data",
    category: "functional",
    identifies: false,
  },
  {
    name: "mk-theme",
    kind: "localStorage",
    surface: "Marketing site",
    purpose: "Your light/dark choice for the website.",
    lifetime: "Until you clear site data",
    category: "functional",
    identifies: false,
  },
  {
    name: "db-ds-theme, dashboard-view, deals-view, dashboard-activity, dashboard-activity-seen, dealbeam-tour-completed",
    kind: "localStorage",
    surface: "App (signed-in)",
    purpose: "Interface preferences: theme, card or list view, whether the activity drawer is open, whether you finished the product tour.",
    lifetime: "Until you clear site data",
    category: "functional",
    identifies: false,
  },
]

export const CATEGORY_LABELS: Record<StorageCategory, { title: string; body: string }> = {
  necessary: {
    title: "Strictly necessary",
    body: "Required for the service you asked for: signing in, staying signed in, opening a password-protected page. These do not need consent.",
  },
  functional: {
    title: "Functional",
    body: "Remember a choice you made (theme, view, an answer to a prompt). They contain no identifier and are never sent to us.",
  },
  analytics: {
    title: "Reading analytics",
    body: "Used only on pages a seller shares with you, so the seller can see that the page was read and by whom. There are no advertising cookies and no third-party trackers anywhere on Dealbeam.",
  },
}
