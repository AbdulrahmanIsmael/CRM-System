import { type AuthFormType } from "@/app/[locale]/(auth)/components/ForgotPasswordForm";
import { motion } from "motion/react";

export default function FormSlot({
  formId,
  activeForm,
  previousForm,
  children,
}: {
  formId: AuthFormType;
  activeForm: AuthFormType;
  previousForm: AuthFormType;
  children: React.ReactNode;
}) {
  const isActive = activeForm === formId;
  const justExited = previousForm === formId && !isActive;

  const target = isActive
    ? { y: 0, opacity: 1 }
    : justExited
      ? { y: -24, opacity: 0 }
      : { y: 24, opacity: 0 };

  return (
    <motion.div
      className="col-start-1 row-start-1 w-full flex justify-center"
      initial={false}
      animate={target}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      style={{ pointerEvents: isActive ? "auto" : "none" }}
      aria-hidden={!isActive}
    >
      {children}
    </motion.div>
  );
}
