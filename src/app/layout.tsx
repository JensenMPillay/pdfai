import "./globals.css";
import { cn, constructMetadata } from "@/lib/utils";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { PropsWithChildren } from "react";
import Providers from "@/components/Providers";
import "react-loading-skeleton/dist/skeleton.css";
import "simplebar-react/dist/simplebar.min.css";
import { Toaster } from "@/components/ui/toaster";
// import AuthProvider from "@/context/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = constructMetadata();

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="light">
      {/* <AuthProvider> */}
      <Providers>
        <body
          className={cn(
            "grainy min-h-screen font-sans antialiased",
            inter.className,
          )}
        >
          {/* Notifications  */}
          <Toaster />
          <Navbar />
          {children}
        </body>
      </Providers>
      {/* </AuthProvider> */}
    </html>
  );
}
