import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }).email({
    message: "Must be a valid email",
  }),
  password: z
    .string()
    .min(12, { message: "Password must be atleast 12 characters" })
    .regex(/^(?=.*[a-z])/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/^(?=.*[A-Z])/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/^(?=.*\d)/, {
      message: "Password must contain at least one number",
    })
    .regex(/^(?=.*[@$!%*?&])/, {
      message: "Password must contain at least one special character",
    }),
});

export type SignInSchemaType = z.infer<typeof signInSchema>;

export const signUpSchema = signInSchema
  .merge(
    z.object({
      name: z
        .string()
        .regex(/^[A-Za-z]+$/)
        .min(1, { message: "Name is required" }),
      confirmPassword: z
        .string()
        .min(1, { message: "Confirm Password is required" }),
    }),
  )
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export type SignUpSchemaType = z.infer<typeof signUpSchema>;
