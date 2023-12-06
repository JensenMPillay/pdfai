"use client";
import React from "react";
import Link from "next/link";
import { getProviders } from "next-auth/react";
import { usePathname } from "next/navigation";
import AuthProvider from "@/components/AuthProvider";
import SignInForm from "@/components/SignInForm";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SignUpForm from "./SignUpForm";

const AuthPage = ({
  csrfToken,
  providers,
}: {
  csrfToken?: string;
  providers: Awaited<ReturnType<typeof getProviders>>;
}) => {
  // Pathname
  const pathname = usePathname();

  // Type Page
  const isSignInPage = pathname.includes("sign-in");

  // Filter Providers List
  let filteredProviders;
  if (providers && "credentials" in providers) {
    const { credentials, ...rest } = providers;
    filteredProviders = rest;
  } else {
    filteredProviders = providers;
  }

  return (
    <MaxWidthWrapper className="mb-8 max-w-5xl text-center">
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
        <div className="m-auto w-full lg:max-w-lg">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-center text-2xl">
                {isSignInPage ? "Sign in" : "Sign up"}
              </CardTitle>
              <CardDescription className="text-center">
                {isSignInPage
                  ? "Enter your Email and Password to Login"
                  : "Create your Account with your Name, Email and Password."}
              </CardDescription>
            </CardHeader>
            {isSignInPage ? (
              <SignInForm csrfToken={csrfToken} />
            ) : (
              <SignUpForm csrfToken={csrfToken} />
            )}
            <div className="relative mb-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <div className="m-2 grid grid-cols-1 gap-6">
              {filteredProviders &&
                Object.values(filteredProviders).map((provider) => (
                  <div key={provider.id}>
                    <AuthProvider provider={provider} />
                  </div>
                ))}
            </div>

            <p className="mb-2 mt-2 text-center text-xs text-gray-700">
              {isSignInPage ? "Don't" : "Already"} have an account?{" "}
              <Link href={isSignInPage ? "/auth/sign-up" : "/auth/sign-in"}>
                <span className="underline">
                  {isSignInPage ? "Sign up" : "Sign in"}
                </span>
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </MaxWidthWrapper>
  );
};

export default AuthPage;