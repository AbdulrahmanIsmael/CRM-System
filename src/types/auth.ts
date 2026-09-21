import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("invalidEmail"),
  password: z.string().min(1, "passwordRequired"),
});

export type SignInFormData = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    fullName: z.string().min(2, "fullNameRequired"),
    email: z.email("invalidEmail"),
    password: z.string().min(6, "passwordTooShort"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordsDontMatch",
    path: ["confirmPassword"],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "invalidEmail" }),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, { message: "passwordMin" }),
    confirmPassword: z.string().min(8, { message: "passwordMin" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
