import Navbar from "@/components/navbar/Navbar";
import { Toaster } from "@/components/ui/toaster";
import TRPCProviders from "@/context/TRPCProviders";
import { cn, constructMetadata } from "@/lib/utils";
import { Inter } from "next/font/google";
import { PropsWithChildren } from "react";
import "react-loading-skeleton/dist/skeleton.css";
import "simplebar-react/dist/simplebar.min.css";
import "./globals.css";
// import AuthProvider from "@/context/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = constructMetadata();

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="light">
      {/* <AuthProvider> */}
      <TRPCProviders>
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
      </TRPCProviders>
      {/* </AuthProvider> */}
    </html>
  );
}
