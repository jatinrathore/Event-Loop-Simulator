import type { Metadata } from "next";
import "./globals.css";
import Providers from "./_components/layout/Providers";

export const metadata: Metadata = {
  title: "JS Event Loop Visualizer",
  description:
    "An interactive, animated visualizer that teaches you how the JavaScript Event Loop processes Microtasks and Macrotasks. Built for developers who want to deeply understand async JavaScript execution.",
  keywords: [
    "JavaScript",
    "Event Loop",
    "Microtask",
    "Macrotask",
    "Promise",
    "setTimeout",
    "Async JavaScript",
    "Visualizer",
    "Educational",
  ],
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
