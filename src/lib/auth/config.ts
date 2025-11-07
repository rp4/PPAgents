import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { prisma } from '@/lib/db/client';

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
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
          console.warn(`Sign-in blocked for domain: ${emailDomain}`);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account, profile }) {
      // Add user ID to token on sign-in
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      // Add user ID to session
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  events: {
    async signIn({ user, isNewUser }) {
      console.log(`User signed in: ${user.email} (new user: ${isNewUser})`);

      // Create profile for new users - delayed to ensure user exists
      if (isNewUser && user.id && user.email) {
        // Use setTimeout to delay profile creation until after the user transaction commits
        setTimeout(async () => {
          try {
            const existingProfile = await prisma.profile.findUnique({
              where: { id: user.id },
            });

            if (!existingProfile) {
              const username = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

              // Ensure unique username
              let finalUsername = username;
              let counter = 1;
              while (await prisma.profile.findUnique({ where: { username: finalUsername } })) {
                finalUsername = `${username}${counter}`;
                counter++;
              }

              await prisma.profile.create({
                data: {
                  id: user.id,
                  username: finalUsername,
                  fullName: user.name || '',
                  avatarUrl: user.image || '',
                },
              });

              console.log(`Created profile for user: ${user.email} with username: ${finalUsername}`);
            }
          } catch (error) {
            console.error('Error creating profile:', error);
          }
        }, 1000); // Delay 1 second to ensure user transaction completes
      }
    },
    async signOut({ session, token }) {
      console.log(`User signed out`);
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
