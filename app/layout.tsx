import resume from "./profile";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  icons: { icon: "/favicon.svg" },
  metadataBase: resume.identity.siteUrl?new URL(resume.identity.siteUrl):undefined,
  title: `${resume.identity.firstName} ${resume.identity.lastName} — ${resume.identity.role}`,
  description: resume.identity.description,
  openGraph: {
    title: `${resume.identity.firstName} ${resume.identity.lastName} — ${resume.identity.role}`,
    description: resume.identity.socialDescription,
    type: "website",
    images: resume.identity.socialImage?[{ url: resume.identity.socialImage, width: 1536, height: 1024, alt: `${resume.identity.firstName} ${resume.identity.lastName} portfolio` }]:[],
  },
  twitter: {
    card: "summary_large_image",
    title: `${resume.identity.firstName} ${resume.identity.lastName} — ${resume.identity.role}`,
    description: resume.identity.socialDescription,
    images: resume.identity.socialImage?[resume.identity.socialImage]:[],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
