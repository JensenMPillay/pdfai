import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { getProviders } from "next-auth/react";
import { redirect } from "next/navigation";
import AuthPage from "@/components/AuthPage";

export default async function Page() {
  // Redirection
  const session = await getServerSession(options);
  const user = session?.user;
  if (user) redirect("/dashboard");
  // Providers
  const providers = await getProviders();

  return <AuthPage providers={providers} />;
}
