import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// In-memory user store for demo (replace with real DB in production)
interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string;
  identity_id?: string;
  account_id?: string;
  profile_id?: string;
  onboarding_status: string;
}

// Attach to globalThis so the store survives Next.js HMR in dev mode
const globalForAuth = globalThis as unknown as { __neobank_users: Map<string, StoredUser> };
if (!globalForAuth.__neobank_users) {
  globalForAuth.__neobank_users = new Map();
}
const users = globalForAuth.__neobank_users;

export function getUser(email: string): StoredUser | undefined {
  return users.get(email);
}

export function updateUser(email: string, data: Partial<StoredUser>) {
  const user = users.get(email);
  if (user) {
    users.set(email, { ...user, ...data });
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        action: { label: 'Action', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Sign up
        if (credentials.action === 'signup') {
          if (users.has(credentials.email)) {
            throw new Error('User already exists');
          }
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          const newUser: StoredUser = {
            id: crypto.randomUUID(),
            email: credentials.email,
            name: credentials.name || credentials.email.split('@')[0],
            password: hashedPassword,
            onboarding_status: 'NOT_STARTED',
          };
          users.set(credentials.email, newUser);
          return { id: newUser.id, email: newUser.email, name: newUser.name };
        }

        // Sign in
        const user = users.get(credentials.email);
        if (!user) throw new Error('No account found with this email');

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error('Invalid password');

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/sign-in',
    newUser: '/sign-up',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }
      // Refresh onboarding status from store
      if (token.email) {
        const storedUser = users.get(token.email as string);
        if (storedUser) {
          token.identity_id = storedUser.identity_id;
          token.account_id = storedUser.account_id;
          token.profile_id = storedUser.profile_id;
          token.onboarding_status = storedUser.onboarding_status;
        }
        console.log('[jwt callback] trigger:', trigger, 'email:', token.email, 'onboarding_status:', token.onboarding_status);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).identity_id = token.identity_id;
        (session.user as any).account_id = token.account_id;
        (session.user as any).profile_id = token.profile_id;
        (session.user as any).onboarding_status = token.onboarding_status || 'NOT_STARTED';
      }
      return session;
    },
  },
};
