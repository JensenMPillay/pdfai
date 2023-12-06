import React from "react";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import SignOut from "@/components/SignOut";

const Page = async () => {
  const session = await getServerSession(options);

  return <SignOut session={session} />;
};

export default Page;
