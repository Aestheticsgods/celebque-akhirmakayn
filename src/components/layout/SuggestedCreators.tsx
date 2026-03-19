'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BadgeCheck } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Creator {
  id: string;
  displayName: string;
  username: string;
  avatar?: string;
  isVerified: boolean;
  subscriberCount?: number;
}

export function SuggestedCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const response = await fetch('/api/creators?limit=5');
        if (!response.ok) throw new Error('Failed to fetch creators');
        const data = await response.json();
        const creatorsArray = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : (data.creators && Array.isArray(data.creators) ? data.creators : []));
        setCreators(creatorsArray.slice(0, 5));
      } catch (error) {
        console.error('Error fetching creators:', error);
        setCreators([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

  return (
    <aside className="hidden xl:block w-80 fixed right-0 top-0 h-screen bg-card/50 border-l border-border p-6 overflow-y-auto">
      <h2 className="font-display font-semibold text-lg text-foreground mb-6">
        Suggested Creators
      </h2>
      
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">Loading creators...</p>
          </div>
        ) : creators.length > 0 ? (
          creators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={`/creators/${creator.id}`}
                className="block p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={creator.avatar || 'https://via.placeholder.com/48'}
                    alt={creator.displayName}
                    className="w-12 h-12 bg-white rounded-full object-cover ring-2 ring-border group-hover:ring-primary/50 transition-all"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground truncate">
                        {creator.displayName}
                      </span>
                      {creator.isVerified && (
                        <BadgeCheck size={16} className="text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      @{creator.username}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {(creator.subscriberCount || 0).toLocaleString()} subscribers
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs hover:bg-primary hover:text-primary-foreground"
                    onClick={(e) => e.preventDefault()}
                  >
                    Follow
                  </Button>
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">No creators available</p>
        )}
      </div>
      
      <div className="mt-6 pt-6 border-t border-border">
        <Link
          href="/discover"
          className="text-sm text-primary hover:underline"
        >
          See more creators →
        </Link>
      </div>
    </aside>
  );
}
