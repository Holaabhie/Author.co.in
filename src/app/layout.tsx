import type { Metadata } from "next";
import { Barlow_Condensed, Inter, Archivo_Black } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Providers from "@/components/providers/Providers";
import CartDrawer from "@/components/cart/CartDrawer";
import SearchModal from "@/components/search/SearchModal";
import InitialPageLoader from "@/components/common/InitialPageLoader";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AUTHOR — Author Your Style | Premium Streetwear",
  description:
    "AUTHOR is a premium streetwear brand for the bold and unapologetic. Shop oversized tees, heavyweight hoodies, cargo joggers, and accessories. Write your story through what you wear.",
  keywords: [
    "AUTHOR",
    "streetwear",
    "premium clothing",
    "oversized tees",
    "hoodies",
    "joggers",
    "Gen-Z fashion",
    "Indian streetwear",
  ],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "AUTHOR — Author Your Style",
    description: "Premium streetwear for the bold and unapologetic.",
    type: "website",
    locale: "en_IN",
    siteName: "AUTHOR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} ${inter.variable} ${archivoBlack.variable}`}>
      <body className="bg-ink text-light font-sans antialiased">
        <Providers>
          <InitialPageLoader />
          <Navbar />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
          <SearchModal />
        </Providers>
      </body>
    </html>
  );
}