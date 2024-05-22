"use client";
import { trpc } from "@/app/_trpc/client";
import { DataTable } from "@/components/table/DataTable";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { fileColumns } from "@/lib/tables/fileColumns";
import Skeleton from "react-loading-skeleton";
import FileUploadButton from "./FileUploadButton";

type DashboardProps = {
  subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>;
};

function Dashboard({ subscriptionPlan }: DashboardProps) {
  // Get Files
  const { data: files, isLoading } = trpc.user.getUserFiles.useQuery();

  return (
    <div className="mx-auto max-w-7xl md:p-10">
      <div className="mt-8 flex flex-col items-start justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0">
        <h1 className="mb-3 text-5xl font-bold text-gray-900">My Files</h1>
        <FileUploadButton isSubscribed={subscriptionPlan.isSubscribed} />
      </div>

      {/* Display User Files */}
      {isLoading ? (
        <Skeleton height={75} className="my-2" count={5} />
      ) : (
        files && <DataTable columns={fileColumns} data={files} />
      )}
    </div>
  );
}

export default Dashboard;
