import type { Metadata } from "next";
import { DM_Sans, Inter, Instrument_Serif } from "next/font/google";
import { Providers } from "@/components/providers";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

// Only the families the app chrome + marketing site actually use load
// globally (font-sans = DM Sans, font-serif = Instrument Serif, marketing
// uses --font-inter). Buyer-page families (Playfair, Lora, Syne, Space
// Grotesk, Fraunces, …) load per page via PubFontLinks (src/lib/pub-fonts.ts)
// so a published page only downloads the fonts its seller picked.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Create and share beautiful sales pages",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the persisted app theme before paint to avoid a flash.
            The buyer surface (/p) themes independently via the seller's page
            settings, so the seller's chrome theme must NOT apply there —
            otherwise gates (email/password) render dark for the seller but
            light for real buyers. Keep in sync with src/hooks/use-app-theme.ts. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(!location.pathname.startsWith('/p/')){var t=localStorage.getItem('db-ds-theme')||localStorage.getItem('sr-ds-theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.setAttribute('data-theme','light');}}}catch(e){}`,
          }}
        />
      </head>
      <body className={`${dmSans.variable} ${inter.variable} ${instrumentSerif.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
