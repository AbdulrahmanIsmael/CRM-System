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
    <span
      className={cn("relative block shrink-0", className)}
      style={{ width, height }}
    >
      <Image
        src="/assets/images/logo.png"
        alt={alt}
        fill
        priority={priority}
        className="hidden object-contain dark:block"
        sizes={`${width}px`}
      />

      <Image
        src="/assets/images/logo-light.png"
        alt={alt}
        fill
        priority={priority}
        className="block object-contain dark:hidden"
        sizes={`${width}px`}
      />
    </span>
  );
}
