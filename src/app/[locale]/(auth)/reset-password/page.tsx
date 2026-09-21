"use client";

import { APP_NAME } from "@/constants";
import BrandLogo from "@/components/ui/BrandLogo";
import { ResetPasswordForm } from "./components/ResetPasswordForm";
import { Suspense } from "react";
import { useTranslations } from "next-intl";

function ResetPasswordContent() {
  const t = useTranslations("Auth");

  return (
    <div className="w-full max-w-5xl flex flex-col md:flex-row bg-surface-light rounded-3xl overflow-hidden shadow-2xl border border-border min-h-150">
      {/* Brand Panel */}
      <div className="w-full md:w-5/12 bg-primary p-12 flex flex-col justify-center items-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="pattern"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="2" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern)" />
          </svg>
        </div>
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="mx-auto mb-8">
            <BrandLogo
              alt={`${APP_NAME} Logo`}
              width={240}
              height={120}
              priority
              className="max-h-28 w-auto drop-shadow-lg"
            />
          </div>
          <p className="text-white/80 leading-relaxed max-w-sm mx-auto mt-2">
            {t("brandSubtitle")}
          </p>
        </div>
      </div>

      {/* Content Panel */}
      <div className="w-full md:w-7/12 p-8 md:p-12 flex items-center justify-center relative bg-bg">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/5 via-bg to-bg blur-2xl pointer-events-none z-0" />

        <div className="relative z-10 w-full flex justify-center">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-text-secondary">Loading...</div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
