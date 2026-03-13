import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FashPrice — AI Fashion Price Comparison",
  description:
    "Compare fashion prices across ASOS, Zalando, Zara, H&M, Uniqlo, Mango, Shein and more — powered by Claude AI.",
  openGraph: {
    title: "FashPrice — AI Fashion Price Comparison",
    description: "Find the best price on any fashion item across 8 major retailers instantly.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Space+Grotesk:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#f8fafc" }}>{children}</body>
    </html>
  );
}
