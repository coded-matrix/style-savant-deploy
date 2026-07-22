import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Hanken_Grotesk, Ubuntu_Condensed } from "next/font/google";
import { AppProvider } from "@/lib/consumer/store";
import { Toaster } from "@/components/consumer/Toaster";
import { DesktopSidebar } from "@/components/consumer/DesktopSidebar";
import { FilmGrain } from "@/components/consumer/FilmGrain";
import { StudioResumeButton } from "@/components/consumer/StudioResumeButton";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

const ubuntuCondensed = Ubuntu_Condensed({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-ubuntu",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Style Savant — Studio",
  description:
    "Try on avant-garde Afro-surrealist fashion. A mobile-first fashion commerce & social platform from Accra.",
};

export const viewport: Viewport = {
  themeColor: "#0d0d0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function ConsumerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${jakarta.variable} ${hanken.variable} ${ubuntuCondensed.variable} min-h-[100dvh] bg-studio-black desktop-ambient flex`}>
      <AppProvider>
        <FilmGrain />
        <DesktopSidebar />
        <div className="flex-1 min-w-0 h-[100dvh]">
          <div className="h-full">
            <div className="w-full relative flex h-full flex-col ss-app">{children}</div>
          </div>
        </div>
        <StudioResumeButton />
        <Toaster />
      </AppProvider>
    </div>
  );
}
