'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Home,
  Compass,
  Bell,
  Star,
  Users,
  Gift,
  User,
  Settings,
  Sparkles,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Compass, label: 'Discover', path: '/discover' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { divider: true },
  { icon: Star, label: 'Become Creator', path: '/become-creator', highlight: true },
  { icon: Users, label: 'Subscriptions', path: '/subscriptions' },
  { icon: Gift, label: 'Promotions', path: '/promotions' },
  { divider: true },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function AppSidebar() {
  const { isCollapsed, toggleSidebar } = useSidebarContext();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check current theme
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col"
    >
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-lg">C</span>
              </div>
              <span className="font-display font-semibold text-xl text-foreground">Celebque</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* User Avatar */}
      <div className={cn(
        "p-4 border-b border-sidebar-border",
        isCollapsed ? "flex justify-center" : ""
      )}>
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed ? "justify-center" : ""
        )}>
            {user?.image && (
          <img
            src={user.image}
            alt={user?.name}
            className="w-10 h-10 rounded-full object-cover bg-white ring-2 ring-primary/30"
          />
          )}
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-1">
        {menuItems.map((item, index) => {
          if ('divider' in item) {
            return <div key={index} className="my-3 border-t border-sidebar-border" />;
          }

          const Icon = item.icon;
          const isActive = pathname === item.path;
          const isCreatorItem = item.path === '/become-creator';

          // Handle creator item: show Creator Dashboard if user is creator, otherwise show Become Creator
          if (isCreatorItem) {
            if (user?.isCreator) {
              // User is a creator - show Creator Dashboard instead
              return (
                <Link
                  key={item.path}
                  href="/creator/dashboard"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                    pathname === '/creator/dashboard'
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "gradient-primary text-primary-foreground hover:opacity-90",
                    isCollapsed ? "justify-center" : ""
                  )}
                >
                  <Star size={20} className="flex-shrink-0" />
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="font-medium"
                      >
                        Creator Dashboard
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            }
            // User is not a creator - show Become Creator
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : item.highlight
                    ? "gradient-primary text-primary-foreground hover:opacity-90"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                isCollapsed ? "justify-center" : ""
              )}
            >
              <Icon size={20} className="flex-shrink-0" />
              
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-medium flex-1"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-1.5 bg-popover text-popover-foreground text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
            isCollapsed ? "justify-center" : ""
          )}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
          {!isCollapsed && <span className="text-sm">{isDark ? 'Light' : 'Dark'}</span>}
        </button>
        
        <button
          onClick={logout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="text-sm">Sign out</span>}
        </button>
      </div>
    </motion.aside>
  );
}
