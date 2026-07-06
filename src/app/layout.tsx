import type { Metadata } from "next";
import { Montserrat, Playfair_Display, Lora, DM_Sans, Syne, Inter, Instrument_Serif } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
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
  title: "SalesRoom",
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
            __html: `try{if(!location.pathname.startsWith('/p/')){var t=localStorage.getItem('sr-ds-theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.setAttribute('data-theme','light');}}}catch(e){}`,
          }}
        />
      </head>
      <body className={`${montserrat.variable} ${playfairDisplay.variable} ${lora.variable} ${dmSans.variable} ${syne.variable} ${inter.variable} ${instrumentSerif.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
