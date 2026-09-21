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
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
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
  // Determine if the current path is an auth path (sign-in, sign-up, confirm-email, etc)
  const isAuthPage = routing.locales.some(
    (locale) =>
      pathname === `/${locale}/sign-in` ||
      pathname === `/${locale}/sign-up` ||
      pathname === `/${locale}/confirm-email` ||
      pathname === `/sign-in` ||
      pathname === `/sign-up` ||
      pathname === `/confirm-email`,
  );

  if (hasUser && isAuthPage) {
    // If user is logged in and tries to access auth pages, redirect to dashboard
    const redirectUrl = new URL("/dashboard", request.url);
    // Let next-intl handle the locale prefix for the redirect
    return handleI18nRouting(
      new NextRequest(redirectUrl, {
        headers: request.headers,
      }),
    );
  }

  if (!hasUser && !isAuthPage && !pathname.includes("/auth/callback")) {
    // If user is NOT logged in and tries to access protected pages, redirect to sign-in
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
  matcher: ["/", "/(ar|en)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
