"use client";
import { ClientSafeProvider, signIn } from "next-auth/react";
import { getProviderIcon } from "./Icons";
import { Button } from "./ui/button";

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
