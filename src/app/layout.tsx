import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Titles use the Andrea Bellarosa script (personal-use license — see README).
const andrea = localFont({
  src: "./fonts/AndreaBellarosa.ttf",
  variable: "--font-andrea",
  display: "swap",
});

// Serif kept for legible numerals (prices, counts); Inter for UI text.
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Book an Appointment",
  description:
    "Book your next hair appointment online — simple, quick, and anytime.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${andrea.variable} ${playfair.variable} ${inter.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
