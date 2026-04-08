'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Settings, Star, Users, Heart, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { GLOBAL_SUBSCRIPTION_FEE_USD } from '@/lib/pricing';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  username?: string;
  image?: string;
  bio?: string;
  role: string;
  isCreator: boolean;
  isVerified: boolean;
}

interface Subscription {
  id: string;
  creatorId: string;
  creator: {
    id: string;
    displayName: string;
    avatar?: string;
    subscriptionFee: number;
  };
  endDate: string;
}

export default function Profile() {
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/update');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    if (!isLoading) {
      fetchProfile();
    }
  }, [isLoading]);

  // Fetch subscriptions
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await fetch('/api/subscriptions');
        if (!response.ok) throw new Error('Failed to fetch subscriptions');
        const data = await response.json();
        const subscriptionsArray = Array.isArray(data)
          ? data
          : (data.subscriptions && Array.isArray(data.subscriptions)
              ? data.subscriptions
              : []);
        setSubscriptions(subscriptionsArray);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        setSubscriptions([]);
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading) {
      fetchSubscriptions();
    }
  }, [isLoading]);

  // Fetch aggregated user stats (likes, posts, subscriptions count)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/user/stats');
        if (!response.ok) throw new Error('Failed to fetch user stats');
        const data = await response.json();

        setLikesCount(
          typeof data.likesReceivedCount === 'number' ? data.likesReceivedCount : 0
        );
        setPostsCount(
          typeof data.postsCount === 'number' ? data.postsCount : 0
        );
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setLikesCount(0);
        setPostsCount(0);
      }
    };

    if (!isLoading) {
      fetchStats();
    }
  }, [isLoading]);

  const stats = [
    { label: 'Subscriptions', value: subscriptions.length, icon: Users },
    { label: 'Likes', value: likesCount, icon: Heart },
    { label: 'Posts', value: postsCount, icon: Grid },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Loading State */}
      {loading || isLoading && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading profile...</div>
        </div>
      )}

      {/* Error State */}
      {!loading && !profile && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Failed to load profile</div>
        </div>
      )}

      {/* Profile Content */}
      {profile && (
        <>
          {/* Header */}
          <div className="relative h-48">
            <div className="absolute top-4 right-4">
              <Link href="/settings/profile">
                <Button variant="glass" size="icon">
                  <Settings size={20} />
                </Button>
              </Link>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 pb-24 lg:pb-6 -mt-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              {/* Avatar & Info */}
              <div className="flex flex-col items-center text-center mb-8">
                {profile.image && (
                  <img
                    src={profile.image}
                    alt={profile.username || 'Profile'}
                    className="w-32 h-32 bg-white rounded-full object-cover ring-4 ring-background shadow-xl mb-4"
                  />
                )}
                <h1 className="font-display font-bold text-2xl text-foreground">
                  {profile.username || profile.name || 'User'}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {profile.bio || 'No bio yet'}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-elevated rounded-xl p-4 text-center"
                    >
                      <Icon size={20} className="text-primary mx-auto mb-2" />
                      <p className="font-display font-bold text-xl text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Become Creator CTA */}
              {!profile.isCreator && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="glass-elevated rounded-2xl p-6 mb-8 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 glow-primary">
                    <Star size={32} className="text-primary-foreground" />
                  </div>
                  <h2 className="font-display font-bold text-xl text-foreground mb-2">
                    Become a Creator
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    Monetize your content and build your community
                  </p>
                  <Link href="/become-creator">
                    <Button variant="gradient" size="lg">
                      Get Started
                    </Button>
                  </Link>
                </motion.div>
              )}

              {/* Creator Dashboard Link */}
              {profile.isCreator && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-8"
                >
                  <Link href="/creator/dashboard">
                    <Button variant="gradient" size="lg" className="w-full">
                      <Star size={20} className="mr-2" />
                      Access Creator Dashboard
                    </Button>
                  </Link>
                </motion.div>
              )}

              {/* Subscriptions Section */}
              <div>
                <h2 className="font-display font-semibold text-lg text-foreground mb-4">
                  My Subscriptions
                </h2>
                {subscriptions.length > 0 ? (
                  <div className="space-y-3">
                    {subscriptions.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/creators/${sub.creatorId}`}
                        className="flex items-center gap-4 p-4 glass-elevated rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <img
                          src={sub.creator.avatar || 'https://via.placeholder.com/50'}
                          alt={sub.creator.displayName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {sub.creator.displayName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Renewal: {sub.endDate ? new Date(sub.endDate).toLocaleDateString('en-US') : 'Active'}
                          </p>
                        </div>
                        <span className="text-sm text-primary font-medium">
                          ${GLOBAL_SUBSCRIPTION_FEE_USD.toFixed(2)}/month
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 glass-elevated rounded-xl">
                    <Users size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      You don't have any subscriptions yet
                    </p>
                    <Link href="/discover" className="text-primary text-sm hover:underline mt-2 block">
                      Discover creators
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
