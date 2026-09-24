"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthInput } from "./AuthInput";
import { signInSchema, type SignInFormData } from "@/types/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";

import { type AuthFormType } from "./ForgotPasswordForm";

interface SignInFormProps {
  onToggleForm: (formType: AuthFormType) => void;
}

export function SignInForm({ onToggleForm }: SignInFormProps) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setIsLoading(false);
        toast.error(error.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
      return;
    } catch (err) {
      setIsLoading(false);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <div className="relative w-full max-w-md p-8 bg-surface rounded-2xl shadow-xl border border-border">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {t("signInTitle")}
        </h2>
        <p className="text-text-secondary">{t("signInSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthInput
          label={t("emailLabel")}
          placeholder={t("emailPlaceholder")}
          type="email"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email ? t(`errors.${errors.email.message}`) : undefined}
          {...register("email")}
        />
        <AuthInput
          label={t("passwordLabel")}
          labelRight={
            <button
              type="button"
              onClick={() => onToggleForm("forgot-password")}
              className="text-primary hover:text-primary-light font-medium transition-colors"
            >
              {t("forgotPassword")}
            </button>
          }
          placeholder={t("passwordPlaceholder")}
          type="password"
          icon={<Lock className="w-4 h-4" />}
          error={
            errors.password ? t(`errors.${errors.password.message}`) : undefined
          }
          {...register("password")}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-light text-white font-medium py-2.5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 active:translate-y-0 flex items-center justify-center mt-6 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t("signInButton")
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-text-secondary">
        {t("noAccount")}{" "}
        <button
          onClick={() => onToggleForm("signup")}
          className="text-primary hover:text-primary-light font-medium transition-colors"
        >
          {t("signUpLink")}
        </button>
      </div>
    </div>
  );
}
