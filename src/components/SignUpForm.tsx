"use client";
import React, { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { TRPCError } from "@trpc/server";
import {
  SignUpSchemaType,
  signUpSchema,
} from "@/lib/schemas/CredentialsSchema";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "./ui/use-toast";
import { CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

const SignUpForm = ({ csrfToken }: { csrfToken: string | undefined }) => {
  // Notifications
  const { toast } = useToast();
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
    // Get Input Values
    getValues,
    formState: { errors },
  } = useForm<SignUpSchemaType>({
    resolver: zodResolver(signUpSchema),
  });

  // Func Submit Inputs Value
  const { mutate: registerUser, isLoading } = trpc.registerUser.useMutation({
    // Mutate onChange
    onMutate: () => {
      toast({
        title: "Setting up your account...",
        description: "You will be redirected automatically.",
        variant: "default",
      });
    },
    // Success Behavior
    onSuccess: async ({ success }) => {
      if (success) {
        const res = await signIn("credentials", {
          email: getValues("email"),
          password: getValues("password"),
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
      }
    },
    // Error Behavior
    onError: (error) => {
      switch (error.data?.code) {
        case "CONFLICT": {
          toast({
            title: "There was a problem...",
            description:
              "This email is already in use. Please use a different email address or Sign In.",
            variant: "destructive",
          });
        }
        case "PARSE_ERROR": {
          toast({
            title: "There was a problem...",
            description: "Please refresh this page and try again.",
            variant: "destructive",
          });
        }
        default: {
          console.log(error.data?.code);
          toast({
            title: "There was a problem...",
            description: error.data?.code,
            variant: "destructive",
          });
        }
      }
    },
  });

  const onSubmit: SubmitHandler<SignUpSchemaType> = async (data, event) => {
    event?.preventDefault();
    try {
      const userRegistered = await registerUser(data);
    } catch (error: any) {
      if (error instanceof Error) console.log(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent className="grid gap-4">
        <Input type="hidden" name="csrfToken" defaultValue={csrfToken} />
        <div className="grid gap-2">
          <Label className="hidden" htmlFor="name" />
          <Input
            id="name"
            // name="name"
            placeholder="Name"
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-2 text-xs italic text-red-700">
              {" "}
              {errors.name?.message}
            </p>
          )}
        </div>
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
        <div className="grid gap-2">
          <Label className="hidden" htmlFor="confirmPassword" />
          <Input
            id="confirmPassword"
            type="password"
            // name="confirmPassword"
            placeholder="Confirm Password"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="mt-2 text-xs italic text-red-700">
              {" "}
              {errors.confirmPassword?.message}
            </p>
          )}
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground">
          By clicking below, you agree to our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </CardContent>
      <CardFooter className="flex flex-col">
        <Button type="submit" className="w-full">
          {isLoading ? (
            <Loader2 className="mr-4 h-4 w-4 animate-spin" />
          ) : (
            "Sign Up"
          )}
        </Button>
      </CardFooter>
    </form>
  );
};

export default SignUpForm;