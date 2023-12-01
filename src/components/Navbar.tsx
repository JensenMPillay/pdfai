import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import UserAccountNav from "./UserAccountNav";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { LoginLink, RegisterLink } from "./Links";
import { buttonVariants } from "./ui/button";

export default async function Navbar() {
  const session = await getServerSession(options);
  const user = session?.user;

  return (
    <nav className="sticky inset-x-0 top-0 z-30 h-14 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all">
      <MaxWidthWrapper>
        <div className="flex h-14 items-center justify-between border-b border-zinc-200">
          <Link href="/" className="z-40 flex font-semibold">
            <span>PDFAI</span>
          </Link>
          {/* <MobileNav isAuth={!!user} /> */}
          <div className="hidden items-center space-x-4 sm:flex">
            {!user ? (
              <>
                <Link
                  href="/pricing"
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                  })}
                >
                  Pricing
                </Link>
                <LoginLink />
                <RegisterLink />
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                  })}
                >
                  Dashboard
                </Link>
                <UserAccountNav
                  name={!user.name ? "Your Account" : `${user.name}`}
                  email={user.email ?? ""}
                  imageUrl={user.image ?? ""}
                />
              </>
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  );
}
