import Dashboard from "@/app/dashboard/components/Dashboard";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { options } from "../api/auth/[...nextauth]/options";

export default async function Page() {
  const session = await getServerSession(options);
  if (!session?.user) redirect("/auth/sign-in");

  const subscriptionPlan = await getUserSubscriptionPlan();

  return <Dashboard subscriptionPlan={subscriptionPlan} />;
}
