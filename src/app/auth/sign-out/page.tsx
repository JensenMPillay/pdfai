import { options } from "@/app/api/auth/[...nextauth]/options";
import SignOut from "@/app/auth/sign-out/components/SignOut";
import { getServerSession } from "next-auth";

const Page = async () => {
  const session = await getServerSession(options);

  return <SignOut session={session} />;
};

export default Page;
