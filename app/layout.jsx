import "./globals.css";
import RegisterSW from "../components/RegisterSW";

export const metadata = {
  title: "NewsPulse — Canadian News, BC Weather & Sports",
  description: "Canadian news briefing, BC wildfire tracker, conflict watch, BC weather, and sports scores in one dashboard.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NewsPulse",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#0b0f14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
