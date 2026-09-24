"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthInput } from "./AuthInput";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/types/auth";
import { createClient } from "@/lib/supabase/client";

export type AuthFormType = "signin" | "signup" | "forgot-password";

interface ForgotPasswordFormProps {
  onToggleForm: (formType: AuthFormType) => void;
}

export function ForgotPasswordForm({ onToggleForm }: ForgotPasswordFormProps) {
  const t = useTranslations("Auth");
  const tc = useTranslations("Common");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(t("forgotPasswordSuccess"));
    } catch (err) {
      console.log(err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md p-8 bg-surface rounded-2xl shadow-xl border border-border">
      <LoadingOverlay show={isLoading} label={tc("loading")} />
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {t("forgotPasswordTitle")}
        </h2>
        <p className="text-text-secondary">{t("forgotPasswordSubtitle")}</p>
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-light text-white font-medium py-2.5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 active:translate-y-0 flex items-center justify-center mt-6 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t("forgotPasswordButton")
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-text-secondary">
        <button
          onClick={() => onToggleForm("signin")}
          className="text-primary hover:text-primary-light font-medium transition-colors"
        >
          {t("backToSignIn")}
        </button>
      </div>
    </div>
  );
}
