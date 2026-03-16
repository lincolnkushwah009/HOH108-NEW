import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import GSAPProvider from "@/components/providers/GSAPProvider";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { CursorProvider } from "@/components/providers/CursorProvider";
import { MagneticCursor } from "@/components/effects/MagneticCursor";
import { PageTransition } from "@/components/effects/PageTransition";
import Preloader from "@/components/layout/Preloader";
import { FluidCursor } from "@/components/effects/FluidCursor";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GOD IS KIND — Where Sustainability Meets the Sacred",
  description:
    "Premium handcrafted home objects made from reclaimed and upcycled materials. Functional art that carries a story of kindness.",
  openGraph: {
    title: "GOD IS KIND",
    description: "Where Sustainability Meets the Sacred",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${inter.variable} font-body antialiased cursor-active`}>
        <GSAPProvider>
          <SmoothScroll>
            <CursorProvider>
              <FluidCursor />
              <MagneticCursor />
              <Preloader />
              <Navbar />
              <PageTransition>
                <main>{children}</main>
              </PageTransition>
              <Footer />
            </CursorProvider>
          </SmoothScroll>
        </GSAPProvider>
      </body>
    </html>
  );
}
