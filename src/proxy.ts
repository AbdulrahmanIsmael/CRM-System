import { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Create a response that handles i18n routing
  const response = handleI18nRouting(request);

  // 2. Set up Supabase client to refresh session and check auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Refresh session if expired and get user
  const { data: claimsData } = await supabase.auth.getClaims();
  const hasUser = Boolean(claimsData?.claims?.sub);

  // 3. Handle auth redirects
  // Public auth pages that authenticated users should be redirected away from
  const isAuthPage = routing.locales.some(
    (locale) =>
      pathname === `/${locale}/sign-in` ||
      pathname === `/${locale}/sign-up` ||
      pathname === `/${locale}/confirm-email` ||
      pathname === `/sign-in` ||
      pathname === `/sign-up` ||
      pathname === `/confirm-email`,
  );

  // Password reset is special:
  // Supabase creates an authenticated recovery session,
  // so authenticated users MUST be allowed to access this page.
  const isPasswordResetPage = routing.locales.some(
    (locale) =>
      pathname === `/${locale}/reset-password` ||
      pathname === `/reset-password`,
  );

  // Authenticated users can access the password reset page
  if (hasUser && isPasswordResetPage) {
    return response;
  }

  if (hasUser && isAuthPage) {
    const redirectUrl = new URL("/dashboard", request.url);

    return handleI18nRouting(
      new NextRequest(redirectUrl, {
        headers: request.headers,
      }),
    );
  }

  if (
    !hasUser &&
    !isAuthPage &&
    !isPasswordResetPage &&
    !pathname.includes("/auth/callback")
  ) {
    const redirectUrl = new URL("/sign-in", request.url);

    return handleI18nRouting(
      new NextRequest(redirectUrl, {
        headers: request.headers,
      }),
    );
  }

  return response;
}

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/(ar|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
