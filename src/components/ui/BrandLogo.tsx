import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
};

export default function BrandLogo({
  width = 148,
  height = 44,
  className,
  priority = false,
  alt = "Nexus CRM",
}: BrandLogoProps) {
  return (
    <span className={cn("relative block", className)}>
      <Image
        src="/assets/images/logo.png"
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="hidden h-auto w-full object-contain dark:block"
      />

      <Image
        src="/assets/images/logo-light.png"
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="block h-auto w-full object-contain dark:hidden"
      />
    </span>
  );
}
