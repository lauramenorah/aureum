import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Public routes - no protection needed
    if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname.startsWith('/api')) {
      return NextResponse.next();
    }

    // Authenticated users accessing onboarding
    if (pathname.startsWith('/onboarding')) {
      if (token?.onboarding_status === 'APPROVED') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return NextResponse.next();
    }

    // App routes - check onboarding status
    if (!token?.onboarding_status || token.onboarding_status === 'NOT_STARTED') {
      return NextResponse.redirect(new URL('/onboarding/welcome', req.url));
    }

    if (token.onboarding_status !== 'APPROVED' && token.onboarding_status !== 'PROFILE_CREATED') {
      return NextResponse.redirect(new URL('/onboarding/welcome', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // Allow public routes
        if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname.startsWith('/api') || pathname === '/') {
          return true;
        }
        // Require auth for everything else
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
