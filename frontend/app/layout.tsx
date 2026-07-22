import type { Metadata } from "next";
import Script from "next/script";
import { Hanken_Grotesk, Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

// Serif display for the luxury fashion direction — used for headings via .ss-app
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Style Savant - Smart Marketplace for Ghanaian Vendors",
  description: "AI-powered body measurement scanner for custom tailoring and fashion marketplace in Ghana",
  keywords: ["Ghana", "marketplace", "tailoring", "body measurement", "AI", "fashion"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${hanken.variable} ${jakarta.variable} ${cormorant.variable} font-sans antialiased`}>
        {/* Apply the persisted theme before hydration to avoid a light flash.
            Falls back to prefers-color-scheme on first visit. */}
        <Script id="ss-theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("ss-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
