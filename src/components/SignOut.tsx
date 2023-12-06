"use client";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { redirect } from "next/navigation";

const SignOut = ({ session }: { session: Session | null }) => {
  const user = session?.user;
  if (user) signOut();
  return redirect("/");
};

export default SignOut;
