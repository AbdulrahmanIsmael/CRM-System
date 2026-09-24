import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return <div className="flex min-h-[40vh] items-center justify-center"><LoaderCircle className="size-7 animate-spin text-primary" aria-label="Loading" /></div>;
}
