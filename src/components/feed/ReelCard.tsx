'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Lock, BadgeCheck, X, Pause ,Play} from 'lucide-react';
import { Post } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { likesAPI, commentsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { GLOBAL_SUBSCRIPTION_FEE_USD } from '@/lib/pricing';

interface ReelCardProps {
  post: Post;
  isActive?: boolean;
  isOwner?: boolean;
  isSubscriber?: boolean;
}

export function ReelCard({ post, isActive = false, isOwner = false, isSubscriber = false }: ReelCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pauseIconTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // URLs are already normalised to /api/media/ by the posts API.
  // This helper only needs to handle the legacy /uploads/media/ paths that may
  // still be stored in the DB and returned for non-post contexts.
  const resolveAssetUrl = (url?: string | null): string => {
    if (!url) return '';

    // Si déjà normalisé
    if (url.startsWith('/api/media/')) return url;

    // Si c'est juste un nom de fichier (sans slash ni http)
    if (!url.startsWith('/') && !url.startsWith('http')) {
      return `/api/media/${url}`;
    }

    // Si c'est un chemin legacy
    if (url.startsWith('/uploads/media/')) {
      const filename = url.split('/').pop();
      if (filename) return `/api/media/${filename}`;
    }

    // Si c'est une URL absolue, on la garde (cas rare, CDN)
    if (url.startsWith('http')) return url;

    // Si c'est une image statique du dossier public (ex: /user.png)
    if (url.startsWith('/user.png')) return url;

    // Sinon, fallback vide (évite les chemins relatifs foireux)
    return '';
  };

  const primaryMediaUrl = resolveAssetUrl(post.mediaUrls?.[0]);
  const creatorAvatarUrl = resolveAssetUrl(post.creator?.avatar || post.user?.image || '/user.png');
  const isVideoPost = ['.mp4', '.webm'].some((extension) =>
    primaryMediaUrl.toLowerCase().split('?')[0].endsWith(extension)
  );

  // Check if user has liked this post on component mount
  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const result = await likesAPI.checkStatus(post.id);
        setIsLiked(result.userLiked);
      } catch (error) {
        console.error('Failed to check like status:', error);
      }
    };

    checkLikeStatus();
  }, [post.id]);

  // Fetch comments when dialog opens
  useEffect(() => {
    if (showCommentDialog) {
      const fetchComments = async () => {
        try {
          setIsLoadingComments(true);
          const result = await commentsAPI.getAll(post.id, 1, 50);
          setComments(result.data || []);
        } catch (error) {
          console.error('Failed to fetch comments:', error);
          toast({
            title: 'Error',
            description: 'Failed to load comments',
            variant: 'destructive',
          });
        } finally {
          setIsLoadingComments(false);
        }
      };

      fetchComments();
    }
  }, [showCommentDialog, post.id]);

  const handleLike = async () => {
    try {
      setIsLoadingLike(true);
      const result = await likesAPI.toggle(post.id);
      setIsLiked(result.liked);
      // Update like count based on the action
      setLikeCount(prev => result.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      const apiError = error as Error & { status?: number };
      toast({
        title: 'Error',
        description: apiError.status === 401 ? 'Please sign in again to like posts' : 'Failed to like this post',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLike(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      setIsSubmittingComment(true);
      await commentsAPI.create(post.id, commentContent);
      setCommentContent('');
      setCommentCount(prev => prev + 1);
      
      // Refresh comments list
      const result = await commentsAPI.getAll(post.id, 1, 50);
      setComments(result.data || []);
      
      toast({
        title: 'Success',
        description: 'Comment posted successfully',
      });
    } catch (error) {
      console.error('Failed to post comment:', error);
      const apiError = error as Error & { status?: number };
      toast({
        title: 'Error',
        description: apiError.status === 401 ? 'Please sign in again to comment' : 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/creator/posts/${post.id}`;
    console.log('Share clicked, copying URL:', shareUrl);
    try {
      await navigator.clipboard.writeText(shareUrl);
      console.log('URL successfully copied to clipboard');
      toast({
        title: '✅ Link Copied!',
        description: `Post URL ready to share`,
      });
    } catch (error) {
      console.error('Failed to copy share link:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.play();
        setIsVideoPlaying(true);
      }
      
      // Show pause icon for 1 second
      setShowPauseIcon(true);
      if (pauseIconTimeoutRef.current) {
        clearTimeout(pauseIconTimeoutRef.current);
      }
      pauseIconTimeoutRef.current = setTimeout(() => {
        setShowPauseIcon(false);
      }, 9500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative w-full h-[calc(100vh-80px)] lg:h-screen snap-start flex items-center justify-center"
    >
      <div className="relative w-full max-w-md mx-auto h-full lg:h-[85vh] rounded-none lg:rounded-2xl overflow-hidden">
        {/* Media */}
        <div className="absolute inset-0 z-0">
          {isVideoPost ? (
            <>
              <video
                ref={videoRef}
                src={primaryMediaUrl}
                className="w-full h-full object-cover cursor-pointer"
                autoPlay
                muted
                loop
                playsInline
                onClick={handleVideoClick}
              />
              {/* Pause Icon Overlay */}
              {showPauseIcon && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="bg-background/60 backdrop-blur-sm rounded-full p-6">
                    {isVideoPlaying ? (
                      <Pause size={48} className="text-white fill-white" />
                    ) : (
                      <Play size={48} className="text-white fill-white" />
                    )}
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            <img
              src={primaryMediaUrl || 'https://via.placeholder.com/800x1200'}
              alt={post.caption}
              className="w-full h-full object-cover"
            />
          )}
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/30 pointer-events-none" />
        </div>

        {/* Locked Content Overlay */}
        {(post.isLocked || post.visibility === 'SUBSCRIBERS_ONLY') && !isOwner && !isSubscriber && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/40 backdrop-blur-xl">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Lock size={32} className="text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                Subscriber-only content
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Subscribe to access this exclusive content
              </p>
              <Link href={`/creators/${post.creatorId}`}>
                <Button className="gradient-primary w-full">
                  Subscribe - ${GLOBAL_SUBSCRIPTION_FEE_USD.toFixed(2)}/month
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Content Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 lg:p-6 pointer-events-none">
          {/* Creator Info */}
          <Link
            href={`/creators/${post.creatorId}`}
            className="flex items-center gap-3 mb-4 group pointer-events-auto"
          >
            <img
              src={creatorAvatarUrl}
              alt={post.creator?.displayName || 'Creator'}
              className="w-12 h-12 rounded-full object-cover bg-white ring-2 ring-primary/50 group-hover:ring-primary transition-all"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">
                  {post.creator?.displayName || 'Unknown Creator'}
                </span>
                {post.creator?.isVerified && (
                  <BadgeCheck size={16} className="text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                @{post.creator?.username || 'unknown'}
              </p>
            </div>
          </Link>

          {/* Caption */}
          <p className="text-foreground text-sm lg:text-base mb-4 line-clamp-3">
            {post.caption}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="absolute right-4 bottom-24 z-20 flex flex-col items-center gap-6 pointer-events-auto">
          <button
            onClick={handleLike}
            disabled={isLoadingLike}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              isLiked ? "bg-primary text-primary-foreground" : "bg-background/50 backdrop-blur-sm text-foreground hover:bg-background/70",
              isLoadingLike && "opacity-50 cursor-not-allowed"
            )}>
              <Heart
                size={24}
                className={cn(isLiked && "fill-current")}
              />
            </div>
            <span className="text-xs text-foreground font-medium">
              {likeCount >= 1000 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
            </span>
          </button>

          <button
            onClick={() => setShowCommentDialog(true)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-12 h-12 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/70 transition-all">
              <MessageCircle size={24} />
            </div>
            <span className="text-xs text-foreground font-medium">
              {commentCount >= 1000 ? `${(commentCount / 1000).toFixed(1)}K` : commentCount}
            </span>
          </button>

          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-12 h-12 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/70 transition-all">
              <Share2 size={24} />
            </div>
            <span className="text-xs text-foreground font-medium">
              Share
            </span>
          </button>
        </div>

        {/* Comment Modal */}
        {showCommentDialog && (
          <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center bg-black/50">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md bg-background rounded-t-2xl lg:rounded-2xl shadow-lg flex flex-col max-h-[85dvh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Comments</h2>
                <button
                  onClick={() => setShowCommentDialog(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {isLoadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading comments...</div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground text-center">
                      <p>No comments yet</p>
                      <p className="text-sm">Be the first to comment!</p>
                    </div>
                  </div>
                ) : (
                  comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <img
                        src={resolveAssetUrl(comment.user?.image || '/user.png')}
                        alt={comment.user?.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="bg-muted rounded-lg p-3">
                          <p className="font-medium text-sm text-foreground">
                            {comment.user?.name || 'Anonymous'}
                          </p>
                          <p className="text-foreground text-sm mt-1 break-words">
                            {comment.content}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Form */}
              <div className="sticky bottom-0 border-t border-border p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] bg-sidebar">
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  <textarea
                    placeholder="Share your thoughts..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="w-full min-h-16 px-3 py-2 bg-muted rounded-lg text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCommentDialog(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!commentContent.trim() || isSubmittingComment}
                      className="gradient-primary w-full sm:w-auto"
                    >
                      {isSubmittingComment ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
