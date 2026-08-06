import type { Metadata } from "next";
import { Roboto, Roboto_Mono, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["300", "600", "700"] });
const roboto = Roboto({ subsets: ["latin"], variable: "--font-roboto", weight: ["400", "500", "700"] });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Taxus — AI-Powered Tax Practice Management",
  description:
    "Taxus is an AI-powered tax practice management, compliance intelligence, and FBR IRIS automation platform. A HALOOL (Private) Limited product.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${roboto.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
