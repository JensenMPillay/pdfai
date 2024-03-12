"use client";
import { trpc } from "@/app/_trpc/client";
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
  SignUpSchemaType,
  signUpSchema,
} from "@/lib/schemas/CredentialsSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";

const SignUpForm = () => {
  // Notifications
  const { toast } = useToast();
  // Router
  const router = useRouter();
  // Get Redirect URL
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const signUpForm = useForm<SignUpSchemaType>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Func Submit Inputs Value
  const { mutate: registerUser, isLoading } =
    trpc.user.registerUser.useMutation({
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
            email: signUpForm.getValues("email"),
            password: signUpForm.getValues("password"),
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
          case "CONFLICT":
            toast({
              title: "There was a problem...",
              description:
                "This email is already in use. Please use a different email address or Sign In.",
              variant: "destructive",
            });
            break;
          case "PARSE_ERROR":
            toast({
              title: "There was a problem...",
              description: "Please refresh this page and try again.",
              variant: "destructive",
            });
            break;
          default:
            console.log(error.data?.code);
            toast({
              title: "There was a problem...",
              description: error.data?.code,
              variant: "destructive",
            });
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
    <Form {...signUpForm}>
      <form onSubmit={signUpForm.handleSubmit(onSubmit)} className="space-4">
        <FormField
          control={signUpForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  className="mx-auto w-3/4"
                  placeholder="Name"
                  type="text"
                  autoCapitalize="on"
                  autoComplete="on"
                  autoCorrect="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={signUpForm.control}
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
          control={signUpForm.control}
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
        <FormField
          control={signUpForm.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  className="mx-auto w-3/4"
                  placeholder="confirmation password"
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
        <p className="m-4 mx-auto text-center text-sm text-muted-foreground">
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
            "Sign Up"
          )}
        </Button>
      </form>
    </Form>
  );
  //   <form onSubmit={handleSubmit(onSubmit)}>
  //     <CardContent className="grid gap-4">
  //       {/* <Input type="hidden" name="csrfToken" defaultValue={csrfToken} /> */}
  //       <div className="grid gap-2">
  //         <Label className="hidden" htmlFor="name" />
  //         <Input
  //           id="name"
  //           // name="name"
  //           placeholder="Name"
  //           {...register("name")}
  //         />
  //         {errors.name && (
  //           <p className="mt-2 text-xs italic text-red-700">
  //             {" "}
  //             {errors.name?.message}
  //           </p>
  //         )}
  //       </div>
  //       <div className="grid gap-2">
  //         <Label className="hidden" htmlFor="email" />
  //         <Input
  //           id="email"
  //           type="email"
  //           // name="email"
  //           placeholder="Email@example.com"
  //           autoComplete="email"
  //           {...register("email")}
  //         />
  //         {errors.email && (
  //           <p className="mt-2 text-xs italic text-red-700">
  //             {" "}
  //             {errors.email?.message}
  //           </p>
  //         )}
  //       </div>
  //       <div className="grid gap-2">
  //         <Label className="hidden" htmlFor="password" />
  //         <Input
  //           id="password"
  //           type="password"
  //           // name="password"
  //           placeholder="Password"
  //           autoComplete="new-password"
  //           {...register("password")}
  //         />
  //         {errors.password && (
  //           <p className="mt-2 text-xs italic text-red-700">
  //             {" "}
  //             {errors.password?.message}
  //           </p>
  //         )}
  //       </div>
  //       <div className="grid gap-2">
  //         <Label className="hidden" htmlFor="confirmPassword" />
  //         <Input
  //           id="confirmPassword"
  //           type="password"
  //           // name="confirmPassword"
  //           placeholder="Confirm Password"
  //           autoComplete="new-password"
  //           {...register("confirmPassword")}
  //         />
  //         {errors.confirmPassword && (
  //           <p className="mt-2 text-xs italic text-red-700">
  //             {" "}
  //             {errors.confirmPassword?.message}
  //           </p>
  //         )}
  //       </div>

  //     </CardContent>
  //     <CardFooter className="flex flex-col">
  //       <Button type="submit" className="w-full">
  //         {isLoading ? (
  //           <Loader2 className="mr-4 h-4 w-4 animate-spin" />
  //         ) : (
  //           "Sign Up"
  //         )}
  //       </Button>
  //     </CardFooter>
  //   </form>
  // );
};

export default SignUpForm;
