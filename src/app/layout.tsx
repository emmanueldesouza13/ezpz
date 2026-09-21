import type { Metadata } from "next";
import "./globals.css";
import ToastHost from "@/components/ToastHost";
import AgeGate from "@/components/AgeGate";

export const metadata: Metadata = {
  title: "EzPz — Local services, booked the easy way",
  description:
    "A modern, trustworthy services marketplace for Guyana. Verified sellers, in-app messaging, and direct MMG payments — no fees to browse.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AgeGate>{children}</AgeGate>
        <ToastHost />
      </body>
    </html>
  );
}
