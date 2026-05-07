import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snak — Cyberpunk Battle Royale",
  description: "A fast-paced, on-chain snake game on Celo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
