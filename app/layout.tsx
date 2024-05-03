import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NoSSRWrapper from "@/components/noSSRWrapper";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create App Video Mockups Locally & Free In-Browser",
  description: "Quickly create video mockups in phone frames, customize sizes and colors, and download instantly—all locally in your browser for free.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <script src="coi-serviceworker.js"></script>
        {
          <NoSSRWrapper>
            {children}
            <Analytics />
          </NoSSRWrapper>
        }
      </body>
    </html>
  );
}
