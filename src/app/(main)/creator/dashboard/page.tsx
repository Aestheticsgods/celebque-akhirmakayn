'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Users, 
  DollarSign, 
  FileImage, 
  TrendingUp, 
  Plus, 
  Eye, 
  Lock,
  MoreVertical,
  Loader,
  Trash2,
  Play,
  CreditCard,
  ExternalLink,
  Wallet,
  ArrowDownToLine,
  HandCoins,
  Clock3
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { postsAPI, creatorsAPI } from '@/lib/api';
import { toast } from 'sonner';

interface RecentTip {
  id: string;
  amount: number;
  createdAt: string;
  supporter: {
    id: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
  } | null;
}

interface CreatorProfile {
  id: string;
  displayName: string;
  subscriberCount: number;
  monthlyRevenue: number;
  postCount: number;
  availableBalance: number;
  pendingBalance: number;
  stripeOnboardingComplete: boolean;
  recentTips?: RecentTip[];
}

export default function CreatorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [creatorPosts, setCreatorPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    const loadCreatorData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch current user's creator profile
        const creatorData = await creatorsAPI.getProfile();
        setCreator(creatorData);

        // Fetch posts for this creator
        const postsResponse = await postsAPI.getAll(1, 50, creatorData.id);
        const posts = Array.isArray(postsResponse.data) 
          ? postsResponse.data 
          : postsResponse;
        setCreatorPosts(posts || []);
      } catch (err) {
        console.error('Failed to load creator data:', err);
        const apiError = err as Error & { status?: number };

        if (apiError.status === 401) {
          toast.error('Please sign in to access your creator dashboard');
          router.push('/');
          return;
        }

        if (apiError.status === 404) {
          toast.error('Creator profile not found. Complete creator setup first.');
          router.push('/become-creator');
          return;
        }

        setError(apiError.message || 'Failed to load creator data');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.email) {
      loadCreatorData();
    }
  }, [session?.user?.email]);

  const handleDeletePost = async (postId: string) => {
    setIsDeleting(true);
    try {
      await postsAPI.delete(postId);
      setCreatorPosts(creatorPosts.filter(p => p.id !== postId));
      setPostToDelete(null);
      toast.success('Post deleted successfully');
    } catch (err) {
      console.error('Failed to delete post:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewPost = (postId: string) => {
    router.push(`/creator/posts/${postId}`);
  };

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.details || data.error || 'Failed to connect Stripe');
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWithdraw = async () => {
    const amountUsd = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(amountUsd) || amountUsd < 10) {
      toast.error('Minimum withdrawal is $10');
      return;
    }
    setIsWithdrawing(true);
    try {
      const res = await fetch('/api/stripe/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: Math.round(amountUsd * 100) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Withdrawal failed'); return; }
      toast.success(`$${amountUsd.toFixed(2)} withdrawal initiated!`);
      setWithdrawAmount('');
      // Refresh creator data
      const updated = await creatorsAPI.getProfile();
      setCreator(updated);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsWithdrawing(false);
    }
  };

  useEffect(() => {
    // Show success toast when returning from Stripe Connect onboarding
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_success') === '1') {
      toast.success('Stripe account connected successfully!');
      window.history.replaceState({}, '', '/creator/dashboard');
    }
    if (params.get('stripe_refresh') === '1') {
      toast.info('Please complete your Stripe onboarding.');
      window.history.replaceState({}, '', '/creator/dashboard');
    }
  }, []);

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
  };

  const stats = [
    { 
      label: 'Subscribers', 
      value: creator?.subscriberCount?.toString() || '0', 
      icon: Users,
      positive: true 
    },
    { 
      label: 'Monthly revenue', 
      value: `$${(creator?.monthlyRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      positive: true 
    },
    { 
      label: 'Total posts', 
      value: creator?.postCount?.toString() || '0', 
      icon: FileImage,
      positive: true 
    },
    { 
      label: 'Monthly views', 
      value: '0', 
      icon: TrendingUp,
      positive: true 
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8 px-4 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader size={40} className="text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Dashboard Content */}
        {!isLoading && creator && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="font-display font-bold text-3xl text-foreground">
                  Creator Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Welcome, {creator.displayName}!
                </p>
              </div>
              <Link href="/create-post">
                <Button variant="gradient">
                  <Plus size={20} className="mr-2" />
                  Create a post
                </Button>
              </Link>
            </div>

        {/* Stats Grid */}
        {!isLoading && creator && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-elevated rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Icon size={20} className="text-primary" />
                    </div>
                  </div>
                  <p className="font-display font-bold text-2xl text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Earnings & Stripe Panel */}
        {!isLoading && creator && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Earnings Card */}
            <div className="glass-elevated rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Wallet size={20} className="text-green-400" />
                </div>
                <h2 className="font-display font-semibold text-lg text-foreground">Earnings</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-secondary/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Available</p>
                  <p className="font-display font-bold text-xl text-green-400">
                    ${((creator.availableBalance || 0) / 100).toFixed(2)}
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Pending</p>
                  <p className="font-display font-bold text-xl text-yellow-400">
                    ${((creator.pendingBalance || 0) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
              {creator.stripeOnboardingComplete && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="10"
                    step="1"
                    placeholder="Amount ($)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="flex-1 rounded-xl border border-input bg-secondary/50 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button
                    variant="gradient"
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                    className="shrink-0"
                  >
                    {isWithdrawing ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <><ArrowDownToLine size={16} className="mr-1" />Withdraw</>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Connect Stripe Card */}
            <div className="glass-elevated rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <CreditCard size={20} className="text-primary" />
                </div>
                <h2 className="font-display font-semibold text-lg text-foreground">Stripe Payouts</h2>
              </div>
              {creator.stripeOnboardingComplete ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                    <p className="text-sm text-green-400 font-medium">Stripe account connected</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your earnings will be transferred directly to your Stripe account when you withdraw.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your Stripe account to receive payouts. Your earnings are tracked automatically.
                  </p>
                  <Button
                    variant="gradient"
                    onClick={handleConnectStripe}
                    disabled={isConnecting}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <Loader size={16} className="animate-spin mr-2" />
                    ) : (
                      <ExternalLink size={16} className="mr-2" />
                    )}
                    {isConnecting ? 'Redirecting...' : 'Connect Stripe Account'}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {!isLoading && creator && (
          <div className="glass-elevated rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <HandCoins size={20} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-lg text-foreground">Recent Tips</h2>
                  <p className="text-xs text-muted-foreground">Latest supporter tips credited to your balance</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                {creator.recentTips?.length || 0} recent {creator.recentTips?.length === 1 ? 'tip' : 'tips'}
              </span>
            </div>

            {creator.recentTips && creator.recentTips.length > 0 ? (
              <div className="space-y-3">
                {creator.recentTips.map((tip) => (
                  <div
                    key={tip.id}
                    className="flex items-center gap-4 rounded-xl bg-secondary/50 px-4 py-3"
                  >
                    <img
                      src={tip.supporter?.image || '/user.png'}
                      alt={tip.supporter?.name || tip.supporter?.username || 'Supporter'}
                      className="h-11 w-11 rounded-full object-cover bg-white"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {tip.supporter?.name || (tip.supporter?.username ? `@${tip.supporter.username}` : 'Anonymous supporter')}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock3 size={12} />
                        <span>{new Date(tip.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-amber-300">
                        +${tip.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">net to creator</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
                <HandCoins size={28} className="mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium text-foreground">No tips yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tips sent from your profile will appear here once Stripe confirms the payment.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Posts Section */}
        {!isLoading && creator && (
          <div className="glass-elevated rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-xl text-foreground">
                My Posts
              </h2>
              <Link href="/creator/posts" className="text-sm text-primary hover:underline">
                See All
              </Link>
            </div>

            <div className="space-y-4">
              {creatorPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                  onClick={() => handleViewPost(post.id)}
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                    {isVideoUrl(post.mediaUrls?.[0]) ? (
                      <>
                        <video
                          src={post.mediaUrls[0]}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play size={20} className="text-white fill-white" />
                        </div>
                      </>
                    ) : (
                      <img
                        src={post.mediaUrls?.[0]}
                        alt={post.caption}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {post.caption}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Eye size={14} />
                        {post.likeCount || 0}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        post.visibility === 'PUBLIC' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-primary/20 text-primary'
                      }`}>
                        {post.visibility === 'PUBLIC' ? 'Free' : (
                          <span className="flex items-center gap-1">
                            <Lock size={10} />
                            Subscribers
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPostToDelete(post.id);
                    }}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} className="text-red-400 hover:text-red-500" />
                  </button>
                </motion.div>
              ))}
            </div>

            {creatorPosts.length === 0 && (
              <div className="text-center py-12">
                <FileImage size={48} className="text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  You don't have any posts yet
                </p>
                <Link href="/create-post">
                  <Button variant="gradient">
                    <Plus size={20} className="mr-2" />
                    Create your first post
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
          </>
        )}

        {/* Delete Post Dialog */}
        <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this post? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => postToDelete && handleDeletePost(postToDelete)}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );
}
