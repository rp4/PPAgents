'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: 'Configuration Error',
      description:
        'There is a problem with the server configuration. Please contact your administrator.',
    },
    AccessDenied: {
      title: 'Access Denied',
      description:
        'You do not have permission to sign in. Please ensure you are using a company email address from an authorized domain.',
    },
    Verification: {
      title: 'Verification Error',
      description:
        'The verification token has expired or has already been used. Please try signing in again.',
    },
    OAuthSignin: {
      title: 'Sign In Error',
      description:
        'Error in constructing an authorization URL. Please try again or contact support.',
    },
    OAuthCallback: {
      title: 'Callback Error',
      description:
        'Error in handling the response from the OAuth provider. Please try again.',
    },
    OAuthCreateAccount: {
      title: 'Account Creation Error',
      description: 'Could not create OAuth provider user in the database. Please try again.',
    },
    EmailCreateAccount: {
      title: 'Account Creation Error',
      description: 'Could not create email provider user in the database. Please try again.',
    },
    Callback: {
      title: 'Callback Error',
      description: 'Error in the OAuth callback handler route. Please try again.',
    },
    OAuthAccountNotLinked: {
      title: 'Account Linking Error',
      description:
        'This email is already associated with another sign-in method. Please use your original sign-in method.',
    },
    EmailSignin: {
      title: 'Email Sign In Error',
      description: 'Failed to send verification email. Please try again.',
    },
    CredentialsSignin: {
      title: 'Sign In Failed',
      description:
        'Invalid credentials. Please check your email and password and try again.',
    },
    SessionRequired: {
      title: 'Session Required',
      description: 'Please sign in to access this page.',
    },
    Default: {
      title: 'Authentication Error',
      description: 'An unexpected error occurred during authentication. Please try again.',
    },
  };

  const errorInfo = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="mt-6 text-2xl font-bold text-gray-900">{errorInfo.title}</h2>
          <p className="mt-2 text-sm text-gray-600">{errorInfo.description}</p>
        </div>

        <div className="mt-8 space-y-4">
          <Link href="/auth/signin">
            <Button className="w-full">Try Again</Button>
          </Link>

          <Link href="/">
            <Button variant="outline" className="w-full">
              Go Home
            </Button>
          </Link>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-500 font-mono">Error code: {error}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            If this problem persists, please contact your system administrator.
          </p>
        </div>
      </Card>
    </div>
  );
}
