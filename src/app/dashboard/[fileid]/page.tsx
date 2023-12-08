import { options } from "@/app/api/auth/[...nextauth]/options";
import ChatWrapper from "@/app/dashboard/[fileid]/components/ChatWrapper";
import PdfRenderer from "@/app/dashboard/[fileid]/components/PdfRenderer";
import { db } from "@/db";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: {
    fileid: string;
  };
}

export default async function Page({ params }: PageProps) {
  // Get File ID
  const { fileid } = params;

  // Get User
  const session = await getServerSession(options);
  const user = session?.user;

  if (!user || !user.id) redirect(`/auth-callback?origin=dashboard/${fileid}`);

  //   Db Call
  const file = await db.file.findFirst({
    where: {
      id: fileid,
      userId: user.id,
    },
  });

  if (!file) notFound();

  const subscriptionPlan = await getUserSubscriptionPlan();

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-1 flex-col justify-between">
      <div className="max-w-8xl mx-auto w-full grow lg:flex xl:px-2">
        {/* Left Sidebar & Main wrapper */}
        <div className="flex-1 xl:flex">
          <div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6">
            {/* Main Area */}
            <PdfRenderer url={file.url} />
          </div>
        </div>

        <div className="flex-[0.75] shrink-0 border-t border-gray-200 lg:w-96 lg:border-l lg:border-t-0">
          <ChatWrapper
            isSubscribed={subscriptionPlan.isSubscribed}
            fileId={file.id}
          />
        </div>
      </div>
    </div>
  );
}
