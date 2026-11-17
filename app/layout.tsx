import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: "400", display: "swap" });

export const metadata: Metadata = {
  title: { default: "MeterProof: fight estimated municipal bills with evidence", template: "%s | MeterProof" },
  description:
    "Log timestamped meter photos, calculate your exact overcharge in Rands, and generate a formal municipal dispute pack. For Johannesburg, eThekwini, Tshwane, Cape Town, Ekurhuleni, Mangaung and Buffalo City.",
  openGraph: {
    title: "MeterProof",
    description: "Fight estimated municipal bills with evidence.",
    locale: "en_ZA",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#f6f3f0" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-ZA" className={geistMono.variable}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        {/* General Sans is the brand face (Fontshare); system sans shows until it arrives. */}
        <link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <a href="#main" className="skip btn btn--ink">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
