'use client';

import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';
  const error = searchParams?.get('error');

  const handleSignIn = (provider: string) => {
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Agent Library
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            AI Agent repository for your company
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Authentication Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error === 'OAuthAccountNotLinked' && (
                    <p>
                      This account is already associated with another sign-in method.
                      Please use your original sign-in method.
                    </p>
                  )}
                  {error === 'AccessDenied' && (
                    <p>
                      Access denied. Please ensure you're using a company email address.
                    </p>
                  )}
                  {error === 'Configuration' && (
                    <p>
                      There is a problem with the server configuration. Please contact
                      your administrator.
                    </p>
                  )}
                  {!['OAuthAccountNotLinked', 'AccessDenied', 'Configuration'].includes(
                    error
                  ) && <p>An error occurred during sign in. Please try again.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {/* Google Workspace Sign-in */}
          {process.env.NEXT_PUBLIC_GOOGLE_ENABLED !== 'false' && (
            <Button
              onClick={() => handleSignIn('google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              variant="outline"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>
          )}

          {/* Azure AD Sign-in */}
          {process.env.NEXT_PUBLIC_AZURE_AD_ENABLED !== 'false' && (
            <Button
              onClick={() => handleSignIn('azure-ad')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              variant="outline"
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23">
                <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              Sign in with Microsoft
            </Button>
          )}

          {/* Fallback for other SSO providers */}
          {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'false' &&
            process.env.NEXT_PUBLIC_AZURE_AD_ENABLED === 'false' && (
              <Button
                onClick={() => handleSignIn('credentials')}
                className="w-full"
              >
                Sign in with SSO
              </Button>
            )}
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Secure authentication via company SSO
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
          <p className="mt-2">
            Only authorized company email addresses are permitted.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
