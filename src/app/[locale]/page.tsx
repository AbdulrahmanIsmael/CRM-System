import { redirect } from "@/i18n/navigation";

export default async function RootPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Redirect root access to the dashboard (proxy will intercept and redirect to sign-in if not authenticated)
  redirect({ href: "/dashboard", locale });
}
