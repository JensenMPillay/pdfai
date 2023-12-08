import { options } from "@/app/api/auth/[...nextauth]/options";
import AuthPage from "@/app/auth/components/AuthPage";
import { getServerSession } from "next-auth";
import { getProviders } from "next-auth/react";
import { redirect } from "next/navigation";

export default async function Page() {
  // Redirection
  const session = await getServerSession(options);
  const user = session?.user;
  if (user) redirect("/dashboard");
  // Providers
  const providers = await getProviders();

  return <AuthPage providers={providers} />;
}
