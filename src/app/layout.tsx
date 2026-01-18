import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CTF Platform - Cybersecurity Training",
    template: "%s | CTF Platform",
  },
  description:
    "A secure Capture The Flag platform for cybersecurity training and competitions. Test your hacking skills across web exploitation, cryptography, forensics, and more.",
  keywords: [
    "CTF",
    "Capture The Flag",
    "Cybersecurity",
    "Hacking",
    "Security Training",
    "Penetration Testing",
  ],
  authors: [{ name: "CTF Platform Team" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    title: "CTF Platform - Cybersecurity Training",
    description:
      "A secure Capture The Flag platform for cybersecurity training and competitions.",
    siteName: "CTF Platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-cyber-dark min-h-screen`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
