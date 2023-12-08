"use client";
import { getProviderIcon } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { ClientSafeProvider, signIn } from "next-auth/react";

type AuthProviderProps = {
  provider: ClientSafeProvider;
};

const AuthProvider = ({ provider }: AuthProviderProps) => {
  const icon = getProviderIcon(provider.name.toLowerCase());
  return (
    <Button onClick={() => signIn(provider.id)} variant="outline">
      {icon}
      {provider.name}
    </Button>
  );
};

export default AuthProvider;
