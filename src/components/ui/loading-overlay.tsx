import { LoaderCircle } from "lucide-react";

export function LoadingOverlay({ show, label }: { show: boolean; label: string }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center rounded-[inherit] bg-background/65 p-6 backdrop-blur-[2px]">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-xl">
        <LoaderCircle className="size-5 animate-spin text-primary" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}
