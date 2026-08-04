import type { Metadata } from "next";
import "./styles.css";
import "./phase-2a-2-premium.css";

export const metadata: Metadata = {
  title: {
    default: "TickMint",
    template: "%s | TickMint",
  },
  description:
    "A professional trading journal and performance analytics workspace.",
  icons: {
    icon: "/tickmint-icon-premium.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}