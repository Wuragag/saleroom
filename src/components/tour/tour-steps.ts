export interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  /** If true, this step is hidden on viewports below 768px (nav items not visible on mobile) */
  desktopOnly?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="new-page"]',
    title: "Create Your First Page",
    description:
      "Build beautiful, shareable pages with our drag-and-drop editor. Choose from templates or start from scratch.",
    position: "bottom",
  },
  {
    targetSelector: '[data-tour="ai-write"]',
    title: "AI Page Generator",
    description:
      "Describe what you need and AI creates a full page for you — complete with sections, copy, and layout.",
    position: "bottom",
  },
  {
    targetSelector: '[data-tour="ai-import"]',
    title: "Import Documents",
    description:
      "Upload PDFs, Docs, or paste a link — we'll convert them into beautifully formatted pages.",
    position: "bottom",
  },
  {
    targetSelector: '[data-tour="nav-analytics"]',
    title: "Track Performance",
    description:
      "See who's viewing your pages, how long they stay, and which links they click.",
    position: "bottom",
    desktopOnly: true,
  },
  {
    targetSelector: '[data-tour="nav-settings"]',
    title: "Team & Billing",
    description:
      "Manage your team members, billing plan, and account settings all in one place.",
    position: "bottom",
    desktopOnly: true,
  },
];

export const STORAGE_KEY = "pager-tour-completed";
