'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Bell, MessageCircle, User, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);

  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    session?.user && (session.user as any).isCreator
      ? { icon: Star, label: 'Dashboard', path: '/creator/dashboard' }
      : { icon: Compass, label: 'Discover', path: '/discover' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const res = await fetch('/api/notifications?page=1&limit=1', {
          cache: 'no-store',
        });

        if (!res.ok) {
          setMessageUnreadCount(0);
          setNotificationUnreadCount(0);
          return;
        }

        const data = await res.json();
        const unreadCount = typeof data.unreadCount === 'number' ? data.unreadCount : 0;
        const unreadByType = (data.unreadByType ?? {}) as Record<string, number>;
        const messageCount = typeof unreadByType.MESSAGE === 'number' ? unreadByType.MESSAGE : 0;

        setMessageUnreadCount(messageCount);
        setNotificationUnreadCount(Math.max(unreadCount - messageCount, 0));
      } catch {
        setMessageUnreadCount(0);
        setNotificationUnreadCount(0);
      }
    };

    fetchUnreadCounts();
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          const badge =
            item.path === '/messages'
              ? messageUnreadCount
              : item.path === '/notifications'
                ? notificationUnreadCount
                : 0;

          return (
            <Link
              key={item.path}
              href={item.path}
              className="relative flex flex-col items-center py-2 px-4"
            >
              <div className="relative">
                <Icon
                  size={24}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] mt-1 transition-colors",
                isActive ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
