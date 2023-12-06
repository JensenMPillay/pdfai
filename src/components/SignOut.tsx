"use client";
import { router } from "@/trpc/trpc";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const SignOut = ({ session }: { session: Session | null }) => {
  const router = useRouter();
  const user = session?.user;
  if (user) {
    signOut({ redirect: false });
    router.refresh();
    router.push("/");
  }
  return null;
};

export default SignOut;
