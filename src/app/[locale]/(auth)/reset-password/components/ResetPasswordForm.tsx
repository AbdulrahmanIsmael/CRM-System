"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthInput } from "../../components/AuthInput";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/types/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";

export function ResetPasswordForm() {
  const t = useTranslations("Auth");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(t("resetPasswordSuccess"));
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md p-8 bg-surface rounded-2xl shadow-xl border border-border text-center z-10">
      <LoadingOverlay show={isLoading} label={tc("loading")} />
      <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">
        {t("resetPasswordTitle")}
      </h2>
      <p className="text-text-secondary mb-8">{t("resetPasswordSubtitle")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
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
            t("resetPasswordButton")
          )}
        </button>
      </form>
    </div>
  );
}
