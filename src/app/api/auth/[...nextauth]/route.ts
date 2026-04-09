import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';

const providers: any[] = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password) {
        throw new Error('Missing credentials');
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user || !user.passwordHash) {
        throw new Error('Invalid credentials');
      }

      const isValid = await compare(
        credentials.password,
        user.passwordHash
      );

      if (!isValid) {
        throw new Error('Invalid credentials');
      }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        isCreator: user.isCreator,
      };
    },
  }),
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : []),
];

const handler = NextAuth({
  session: {
    strategy: 'jwt',
  },
  providers,

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.isCreator = (user as any).isCreator;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image ?? null;
      }
      
      // Handle session updates from client-side update() call
      if (trigger === 'update' && session) {
        token.isCreator = session.isCreator ?? token.isCreator;
        token.name = session.name ?? token.name;
        token.picture = session.image ?? token.picture;
      }
      
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = (token.name as string | undefined) ?? null;
        session.user.email = (token.email as string | undefined) ?? session.user.email;
        session.user.image = (token.picture as string | undefined) ?? null;
        (session.user as any).isCreator = token.isCreator;
      }
      return session;
    },
  },

  pages: {
    signIn: '/',
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
