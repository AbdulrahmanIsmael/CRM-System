"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthInput } from "./AuthInput";
import { signUpSchema, type SignUpFormData } from "@/types/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";

import { type AuthFormType } from "./ForgotPasswordForm";

interface SignUpFormProps {
  onToggleForm: (formType: AuthFormType) => void;
}

export function SignUpForm({ onToggleForm }: SignUpFormProps) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      router.push(`/confirm-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 md:p-8 bg-surface rounded-2xl shadow-xl border border-border">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {t("signUpTitle")}
        </h2>
        <p className="text-text-secondary">{t("signUpSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <AuthInput
          label={t("fullNameLabel")}
          placeholder={t("fullNamePlaceholder")}
          type="text"
          icon={<User className="w-4 h-4" />}
          error={
            errors.fullName ? t(`errors.${errors.fullName.message}`) : undefined
          }
          {...register("fullName")}
        />
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
          placeholder={t("passwordPlaceholder")}
          type="password"
          icon={<Lock className="w-4 h-4" />}
          error={
            errors.password ? t(`errors.${errors.password.message}`) : undefined
          }
          {...register("password")}
        />
        <AuthInput
          label={t("confirmPasswordLabel")}
          placeholder={t("passwordPlaceholder")}
          type="password"
          icon={<Lock className="w-4 h-4" />}
          error={
            errors.confirmPassword
              ? t(`errors.${errors.confirmPassword.message}`)
              : undefined
          }
          {...register("confirmPassword")}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-light text-white font-medium py-2.5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 active:translate-y-0 flex items-center justify-center mt-6 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t("signUpButton")
          )}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-text-secondary">
        {t("hasAccount")}{" "}
        <button
          onClick={() => onToggleForm("signin")}
          className="text-primary hover:text-primary-light font-medium transition-colors"
        >
          {t("signInLink")}
        </button>
      </div>
    </div>
  );
}
