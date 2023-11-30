import React from "react";
import { getServerSession } from "next-auth";
import { options } from "../api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { db } from "@/db";
import Dashboard from "@/components/Dashboard";

export default async function Page() {
  const session = await getServerSession(options);
  if (!session?.user) redirect("/auth-callback?origin=dashboard");

  const dbUser = await db.user.findFirst({
    where: {
      id: session?.user.id,
    },
  });

  if (!dbUser) redirect("/auth-callback?origin=dashboard");

  return <Dashboard />;
}
