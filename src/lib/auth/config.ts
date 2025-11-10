import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { prisma } from '@/lib/db/client';
import { generateSafeUsername, validateUsername } from '@/lib/security/sanitize';
import { logger, logSecurityEvent } from '@/lib/security/logger';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    // Google Workspace SSO (uncomment and configure if using)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                // Restrict to specific domain
                hd: process.env.GOOGLE_HD,
              },
            },
          }),
        ]
      : []),

    // Azure AD SSO (uncomment and configure if using)
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            tenantId: process.env.AZURE_AD_TENANT_ID,
          }),
        ]
      : []),

    // Add other SSO providers here (Okta, Auth0, etc.)
    // See: https://next-auth.js.org/providers/
  ],

  session: {
    strategy: 'jwt', // Use JWT for stateless sessions (recommended for serverless)
    maxAge: 7 * 24 * 60 * 60, // 7 days (reduced from 30 for security)
    updateAge: 24 * 60 * 60, // Refresh token daily
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Email domain restriction (optional)
      if (process.env.ALLOWED_EMAIL_DOMAINS) {
        const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS.split(',');
        const emailDomain = user.email?.split('@')[1];

        if (emailDomain && !allowedDomains.includes(emailDomain)) {
          logSecurityEvent('signin_blocked_domain', 'medium', {
            domain: emailDomain,
            provider: account?.provider,
          });
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account, profile }) {
      // Add user ID to token on sign-in
      if (user) {
        token.id = user.id;

        // Fetch username from profile
        const userProfile = await prisma.profile.findUnique({
          where: { id: user.id },
          select: { username: true },
        });

        if (userProfile) {
          token.username = userProfile.username;
        }
      }
      return token;
    },

    async session({ session, token }) {
      // Add user ID and username to session
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.username = token.username as string | null;
      }
      return session;
    },
  },

  events: {
    async signIn({ user, isNewUser }) {
      logger.info('User signed in', { userId: user.id, isNewUser });

      // Create profile for new users using proper transaction handling
      if (isNewUser && user.id && user.email) {
        try {
          await prisma.$transaction(async (tx) => {
            // Check if profile already exists
            const existingProfile = await tx.profile.findUnique({
              where: { id: user.id },
            });

            if (existingProfile) {
              return; // Profile already exists, skip creation
            }

            // Generate safe username from email
            let username = generateSafeUsername(user.email);

            // Ensure username is unique
            let counter = 1;
            while (await tx.profile.findUnique({ where: { username } })) {
              username = `${username}${counter}`;
              counter++;
            }

            // Validate final username
            const validation = validateUsername(username);
            if (!validation.valid) {
              // Fallback to UUID-based username if validation fails
              username = `user_${user.id.substring(0, 8)}`;
            }

            // Create profile
            await tx.profile.create({
              data: {
                id: user.id,
                username,
                fullName: user.name || '',
                avatarUrl: user.image || '',
              },
            });

            logger.info('Profile created', { userId: user.id, username });
          });
        } catch (error) {
          logger.error('Failed to create profile', {
            userId: user.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
