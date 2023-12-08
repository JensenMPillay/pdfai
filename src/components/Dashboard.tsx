"use client";
import { trpc } from "@/app/_trpc/client";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { fileColumns } from "@/lib/tables/fileColumns";
import { Ghost } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import { DataTable } from "./DataTable";
import FileUploadButton from "./FileUploadButton";

type DashboardProps = {
  subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>;
};

function Dashboard({ subscriptionPlan }: DashboardProps) {
  // Get Files
  const { data: files, isLoading } = trpc.getUserFiles.useQuery();

  return (
    <main className="mx-auto max-w-7xl md:p-10">
      <div className="mt-8 flex flex-col items-start justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0">
        <h1 className="mb-3 text-5xl font-bold text-gray-900">My Files</h1>
        <FileUploadButton isSubscribed={subscriptionPlan.isSubscribed} />
      </div>

      {/* Display User Files */}
      {files ? (
        <DataTable columns={fileColumns} data={files} />
      ) : isLoading ? (
        <Skeleton height={75} className="my-2" count={5} />
      ) : (
        <div className="mt-16 flex flex-col items-center gap-2">
          <Ghost className="h-8 w-8 text-zinc-800" />
          <h3 className="text-xl font-semibold">Pretty empty around here</h3>
          <p>Let&apos;s upload your first PDF.</p>
        </div>
      )}
    </main>
  );
}

export default Dashboard;
