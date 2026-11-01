import type { Metadata } from "next";
import { Inter, Fraunces, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const ibmArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-ibm-arabic",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "StudioFlow",
    template: "%s · StudioFlow",
  },
  description:
    "Build, edit, and manage every client website — natively or from GitHub — with an AI assistant that respects your review process.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Default locale is English LTR. A locale switcher in Milestone 2 will set
  // `lang` and `dir` based on the user's profile.locale.
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${fraunces.variable} ${ibmArabic.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
