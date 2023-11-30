import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React from "react";
import { buttonVariants } from "./ui/button";

export function LoginLink() {
  return (
    <Link
      className={buttonVariants({
        variant: "ghost",
        size: "sm",
      })}
      href="http://localhost:3000/api/auth/signin/"
    >
      Sign in
    </Link>
  );
}

export function RegisterLink() {
  return (
    <Link
      className={buttonVariants({
        size: "sm",
      })}
      href="http://localhost:3000/api/auth/new-user/"
    >
      Get started <ArrowRight className="ml-1.5 h-5 w-5" />
    </Link>
  );
}
