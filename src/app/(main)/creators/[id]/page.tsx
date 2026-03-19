'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BadgeCheck, Lock, Grid, Heart, ArrowLeft, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface Creator {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  subscriptionFee: number;
  isVerified: boolean;
  subscriberCount: number;
  postCount: number;
}

interface Post {
  id: string;
  caption: string;
  mediaUrls: string[];
  visibility: string;
  likeCount: number;
  commentCount: number;
}

export default function CreatorProfile() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [creator, setCreator] = useState<Creator | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        setLoading(true);
        
        // Fetch creator data
        const creatorRes = await fetch(`/api/creators/${id}`);
        if (!creatorRes.ok) throw new Error('Failed to fetch creator');
        const creatorData = await creatorRes.json();
        setCreator(creatorData);

        // Fetch creator's public posts
        const postsRes = await fetch(`/api/posts?creatorId=${id}`);
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          const postsArray = Array.isArray(postsData) ? postsData : (postsData.data && Array.isArray(postsData.data) ? postsData.data : []);
          setPosts(postsArray);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load creator');
        setCreator(null);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCreatorData();
    }
  }, [id]);

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please log in to subscribe.');
      return;
    }
    if (!creator) return;

    try {
      setIsSubscribing(true);
      toast.info('Preparing checkout...');

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: creator.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to start checkout');
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Creator not found</h1>
          <p className="text-muted-foreground mb-6">{error || 'This creator does not exist.'}</p>
          <Link href="/discover" className="text-primary hover:underline">
            Back to discover
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Banner */}
      <div className="relative h-48 lg:h-64">
        <img
          src={creator.banner || 'https://placehold.net/800x600.png'}
          alt={`${creator.displayName} banner`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        <Link
          href="/discover"
          className="absolute top-4 left-4 p-2 rounded-full glass backdrop-blur-xl"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </Link>
      </div>

      {/* Profile Content */}
      <div className="px-4 lg:px-8 -mt-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Avatar & Info */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
            <img
              src={creator.avatar || '/user.png'}
              alt={creator.displayName}
              className="w-28 h-28 rounded-full object-cover ring-4 ring-background shadow-xl bg-white"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display font-bold text-2xl lg:text-3xl text-foreground">
                  {creator.displayName}
                </h1>
                {creator.isVerified && (
                  <BadgeCheck size={24} className="text-primary" />
                )}
              </div>
              <p className="text-muted-foreground">@{creator.username}</p>
            </div>
            
            {!isSubscribed ? (
              <Button
                variant="gradient"
                size="lg"
                onClick={handleSubscribe}
                disabled={isSubscribing}
                className="w-full lg:w-auto"
              >
                {isSubscribing ? 'Redirecting...' : `Subscribe - €${creator?.subscriptionFee.toFixed(2)}/month`}
              </Button>
            ) : (
              <Button variant="secondary" size="lg" className="w-full lg:w-auto">
                Subscribed ✓
              </Button>
            )}
          </div>

          {/* Bio */}
          <p className="text-foreground mb-6">{creator.bio}</p>

          {/* Stats */}
          <div className="flex items-center gap-6 mb-8 justify-evenly">
            <div className="text-center">
              <p className="font-display font-bold text-xl text-foreground">
                {creator?.subscriberCount?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-muted-foreground">Subscribers</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-xl text-foreground">
                {creator.postCount}
              </p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4">
            {posts.map((post, index) => (
              <Link
                key={post.id}
                href={`/creator/posts/${post.id}`}
                className="block"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                >
                  {isVideoUrl(post.mediaUrls?.[0]) ? (
                    <>
                      <video
                        src={post.mediaUrls[0]}
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                        <Play size={48} className="text-white fill-white" />
                      </div>
                    </>
                  ) : (
                    <img
                      src={post.mediaUrls?.[0] || 'https://via.placeholder.com/400x400'}
                      alt={post.caption}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1 text-foreground">
                      <Heart size={20} className="fill-current" />
                      <span className="font-medium">{post.likeCount}</span>
                    </div>
                  </div>

                  {/* Lock indicator for subscriber-only content */}
                  {post.visibility === 'SUBSCRIBERS_ONLY' && !isSubscribed && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center">
                        <Lock size={32} className="text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Reserved for subscribers</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </Link>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-16 glass-elevated rounded-2xl">
              <Grid size={48} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
