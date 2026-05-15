import type { Metadata, Viewport } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "./globals.css";
import { Providers } from "./providers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://snak.timjosh507.workers.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  manifest: "/manifest.json",
  applicationName: "Snak",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Snak" },
  title: "Snak — Sats-staked Snake Battle Royale",
  description: "A fast-paced, on-chain snake game on Celo. Last serpent alive takes the pool.",
  openGraph: {
    type: "website",
    siteName: "Snak",
    title: "Snak — Sats-staked Snake Battle Royale",
    description: "A fast-paced, on-chain snake game on Celo. Last serpent alive takes the pool.",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Snak — Cyberpunk Battle Royale" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Snak — Sats-staked Snake Battle Royale",
    description: "A fast-paced, on-chain snake game on Celo.",
    images: ["/og.png"],
  },
  other: {
    "talentapp:project_verification":
      "1763d7a6a8928739f805860357946c1c50b1851677b657a06c4b80142263ce8738a84125e1bc19c059b4fd1469e022a70e44ec32cc4d2b84d41f663cafbe0aba",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
