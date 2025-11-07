// DEPRECATED: Auth moved to NextAuth
// This file is a stub for backward compatibility

export const signIn = async () => {
  throw new Error('Supabase auth deprecated. Use NextAuth at /api/auth/signin');
};

export const signOut = async () => {
  throw new Error('Supabase auth deprecated. Use NextAuth signOut');
};

export const getUser = async () => {
  return null;
};
