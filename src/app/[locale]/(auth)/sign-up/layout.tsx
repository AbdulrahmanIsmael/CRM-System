import { buildPageMetadata, type AppLocale } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata({ locale: locale as AppLocale, key: "signUp", path: "/sign-up" });
}

export default function SignUpLayout({ children }: { children: React.ReactNode }) { return children; }
