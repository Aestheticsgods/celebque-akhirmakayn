'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, BadgeCheck, TrendingUp, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GLOBAL_SUBSCRIPTION_FEE_USD } from '@/lib/pricing';

interface Creator {
  id: string;
  displayName: string;
  username: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  isVerified: boolean;
  subscriptionFee: number;
}

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/creators');
        if (!response.ok) throw new Error('Failed to fetch creators');
        const data = await response.json();
        const creatorsArray = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : (data.creators && Array.isArray(data.creators) ? data.creators : []));
        setCreators(creatorsArray);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load creators');
        setCreators([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);
  
  const filteredCreators = creators.filter(creator =>
    creator.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background py-8 px-4 lg:px-8 pb-24 lg:pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">
            Discover
          </h1>
          <p className="text-muted-foreground">
            Explore the most popular creators
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search a creator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Trending Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-primary" />
            <h2 className="font-display font-semibold text-lg text-foreground">
              Trending
            </h2>
          </div>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {['Fitness', 'Art', 'Cuisine', 'Voyage', 'Lifestyle', 'Gaming'].map((tag) => (
              <Button
                key={tag}
                variant="secondary"
                size="sm"
                className="flex-shrink-0"
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>

        {/* Creators Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-elevated rounded-2xl overflow-hidden">
                <Skeleton className="h-24 w-full" />
                <div className="p-5 -mt-8">
                  <div className="flex gap-4 mb-4">
                    <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-5 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 glass-elevated rounded-2xl">
            <Search size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCreators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={`/creators/${creator.id}`}
                className="block glass-elevated rounded-2xl overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all group"
              >
                {/* Banner */}
                <div className="relative h-24">
                  <img
                    src={creator.banner}
                    alt={`${creator.displayName} banner`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5 -mt-8 relative">
                  <div className="flex items-end gap-4 mb-3">
                    <img
                      src={creator.avatar}
                      alt={creator.displayName}
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-card"
                    />
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-foreground truncate">
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

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {creator.bio}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {(creator as any).subscriberCount?.toLocaleString() || '0'} subscribers
                    </span>
                    <Button size="sm" variant="gradient">
                      ${GLOBAL_SUBSCRIPTION_FEE_USD.toFixed(2)}/month
                    </Button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        )}

        {!loading && !error && filteredCreators.length === 0 && (
          <div className="text-center py-16 glass-elevated rounded-2xl">
            <Search size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No creators found</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
