import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SalesRoom — Know the moment your buyer reads your proposal",
  description:
    "Stop sending proposals into silence. SalesRoom gives you one beautiful link and tells you exactly how your buyer engages with every section.",
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Standalone marketing layout — no app shell, no sidebar, no topbar.
  // Fonts (--font-syne, --font-dm-sans) are already registered by the root layout.
  return <>{children}</>
}
