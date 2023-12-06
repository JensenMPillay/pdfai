"use client";
import React, { useState } from "react";
import {
  SignInSchemaType,
  signInSchema,
} from "@/lib/schemas/CredentialsSchema";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "./ui/use-toast";
import { CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

const SignInForm = ({ csrfToken }: { csrfToken: string | undefined }) => {
  // Notifications
  const { toast } = useToast();
  // Loading State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Router
  const router = useRouter();
  // Get Redirect URL
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const {
    // Track Inputs for Validation & Submission
    register,
    // Validate Inputs Value
    handleSubmit,
    formState: { errors },
  } = useForm<SignInSchemaType>({
    resolver: zodResolver(signInSchema),
  });

  // Func Submit Inputs Value
  const onSubmit: SubmitHandler<SignInSchemaType> = async (data, event) => {
    event?.preventDefault();
    try {
      setIsLoading(true);

      const res = await signIn("credentials", {
        email: data?.email,
        password: data?.password,
        redirect: false,
        callbackUrl,
      });

      if (!res?.error) {
        router.refresh();
        router.push(callbackUrl);
      } else {
        toast({
          title: "There was a problem...",
          description: res?.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      if (error instanceof Error) console.log(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent className="grid gap-4">
        <Input type="hidden" name="csrfToken" defaultValue={csrfToken} />
        <div className="grid gap-2">
          <Label className="hidden" htmlFor="email" />
          <Input
            id="email"
            type="email"
            // name="email"
            placeholder="Email@example.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-2 text-xs italic text-red-700">
              {" "}
              {errors.email?.message}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label className="hidden" htmlFor="password" />
          <Input
            id="password"
            type="password"
            // name="password"
            placeholder="Password"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-2 text-xs italic text-red-700">
              {" "}
              {errors.password?.message}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col">
        <Button type="submit" className="w-full">
          {isLoading ? (
            <Loader2 className="mr-4 h-4 w-4 animate-spin" />
          ) : (
            "Login"
          )}
        </Button>
      </CardFooter>
    </form>
  );
};

export default SignInForm;
