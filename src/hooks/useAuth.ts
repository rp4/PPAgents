'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';

interface Profile {
  id: string;
  username: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  website: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  reputationScore: number;
  isVerified: boolean;
}

interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name,
        image: session.user.image,
      }
    : null;

  // Fetch profile data when user is authenticated
  const [profile, setProfile] = React.useState<Profile | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/users/${user.id}/profile`)
        .then((res) => res.json())
        .then((data) => setProfile(data))
        .catch((err) => console.error('Failed to fetch profile:', err));
    } else {
      setProfile(null);
    }
  }, [user?.id]);

  // Invalidate queries when auth state changes
  useEffect(() => {
    if (status !== 'loading') {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  }, [status, queryClient]);

  const handleSignIn = async () => {
    await signIn();
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
    queryClient.clear();
  };

  const value = {
    user,
    profile,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

