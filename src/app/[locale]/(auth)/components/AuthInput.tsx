"use client";

import React, { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface AuthInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  labelRight?: React.ReactNode;
  error?: string;
  icon?: React.ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, labelRight, error, icon, className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === "password";
    
    // Determine actual input type
    const inputType = isPasswordField ? (showPassword ? "text" : "password") : type;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex justify-between items-center w-full">
          <label className="text-sm font-medium text-text-primary">
            {label}
          </label>
          {labelRight && <div className="text-sm">{labelRight}</div>}
        </div>
        <div className="relative">
          {icon && (
            <div className="absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 text-text-muted pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all shadow-sm",
              icon && "pl-10 rtl:pl-4 rtl:pr-10",
              isPasswordField && "pr-10 rtl:pr-4 rtl:pl-10",
              error && "border-danger focus:ring-danger",
              className
            )}
            {...props}
          />
          {isPasswordField && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 -translate-y-1/2 right-3 rtl:right-auto rtl:left-3 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-danger mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);
AuthInput.displayName = "AuthInput";
