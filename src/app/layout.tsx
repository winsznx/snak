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
  other: {
    "talentapp:project_verification":
      "1763d7a6a8928739f805860357946c1c50b1851677b657a06c4b80142263ce8738a84125e1bc19c059b4fd1469e022a70e44ec32cc4d2b84d41f663cafbe0aba",
  },
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
