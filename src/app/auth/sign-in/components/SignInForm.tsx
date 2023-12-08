"use client";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  SignInSchemaType,
  signInSchema,
} from "@/lib/schemas/CredentialsSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

const SignInForm = () => {
  // Notifications
  const { toast } = useToast();
  // Loading State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Router
  const router = useRouter();
  // Get Redirect URL
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const signInForm = useForm<SignInSchemaType>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
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
    <Form {...signInForm}>
      <form onSubmit={signInForm.handleSubmit(onSubmit)} className="space-4">
        <FormField
          control={signInForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  className="mx-auto w-3/4"
                  placeholder="email@example.com"
                  type="email"
                  autoCapitalize="off"
                  autoComplete="email"
                  autoCorrect="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={signInForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  className="mx-auto w-3/4"
                  placeholder="password"
                  type="password"
                  autoCapitalize="off"
                  autoComplete="new-password"
                  autoCorrect="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className={buttonVariants({
            className: "m-4 w-3/4",
            variant: "default",
          })}
          type="submit"
        >
          {isLoading ? (
            <Loader2 className="mr-4 h-4 w-4 animate-spin" />
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default SignInForm;
