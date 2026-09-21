import { redirect } from "@/i18n/navigation";

// The sign-up route is just a redirect to sign-in since they share the same UI component
export default async function SignUpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/sign-in", locale });
}
