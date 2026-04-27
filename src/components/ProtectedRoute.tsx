'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'creator' | 'user';
}

export function ProtectedRoute({ 
  children, 
  requiredRole 
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (requiredRole === 'creator' && session?.user?.isCreator === false) {
      router.push('/become-creator');
      return;
    }
  }, [status, session, requiredRole, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (requiredRole === 'creator' && session?.user?.isCreator === false) {
    return null;
  }

  return <>{children}</>;
}
