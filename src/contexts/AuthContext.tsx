'use client'

import React, { createContext, useContext, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  upgradeToCreator: (displayName: string, bio: string, price: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const isLoading = status === 'loading';
  const isAuthenticated = !!session?.user;
  const user = session?.user;

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        console.error('Login error:', result.error);
        return false;
      }

      router.push('/home');
      router.refresh();
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      await signIn('google', { callbackUrl: '/home' });
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Unknown Error');
      }

      // Auto login after signup
      return await login(email, password);
    } catch (error: any) {
      throw new Error(error.message || 'Unknown Error');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const upgradeToCreator = async (
    displayName: string, 
    bio: string, 
    price: number
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/creator/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          bio,
          subscriptionPrice: price,
        }),
      });

      if (!response.ok) {
        return false;
      }

      // Update the session with new creator status
      await update({ isCreator: true });
      router.push('/creator/dashboard');
      router.refresh();
      return true;
    } catch (error) {
      console.error('Upgrade error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      loginWithGoogle,
      signup,
      logout,
      upgradeToCreator,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}