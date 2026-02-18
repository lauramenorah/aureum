import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken, encode } from 'next-auth/jwt';
import { authOptions, updateUser } from '@/lib/auth/auth-options';

const secret = process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { identity_id, account_id, profile_id } = body;

    // Update the in-memory user store
    updateUser(session.user.email, {
      onboarding_status: 'APPROVED',
      identity_id,
      account_id,
      profile_id,
    });

    // Read the current JWT, update it, and re-encode it into the cookie
    // so the middleware sees the new onboarding_status immediately
    const token = await getToken({ req: request, secret });
    if (token) {
      token.onboarding_status = 'APPROVED';
      token.identity_id = identity_id;
      token.account_id = account_id;
      token.profile_id = profile_id;

      const encoded = await encode({ token, secret });

      const response = NextResponse.json({ ok: true });
      // In dev, Next.js uses non-secure cookies (no __Secure- prefix)
      const cookieName = process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token';
      response.cookies.set(cookieName, encoded, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[update-onboarding] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
