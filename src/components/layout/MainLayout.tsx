'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AppSidebar } from './AppSidebar';
import { MobileNav } from './MobileNav';
import { SuggestedCreators } from './SuggestedCreators';
import { useSidebarContext } from '@/contexts/SidebarContext';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isCollapsed } = useSidebarContext();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Main Content */}
      <main
        className="min-h-screen transition-all duration-300 lg:ml-[260px] xl:mr-80 pb-20 lg:pb-0"
      >
        {children}
      </main>

      {/* Desktop Right Sidebar */}
      <SuggestedCreators />

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
