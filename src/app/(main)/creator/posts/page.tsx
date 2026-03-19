'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Eye, 
  Lock,
  Trash2,
  Loader
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

export default function CreatorPostsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch current user's creator profile
        const creatorData = await creatorsAPI.getProfile();

        // Fetch all posts for this creator
        const postsResponse = await postsAPI.getAll(1, 100, creatorData.id);
        const allPosts = Array.isArray(postsResponse.data) 
          ? postsResponse.data 
          : postsResponse;
        setPosts(allPosts || []);
      } catch (err) {
        console.error('Failed to load posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.email) {
      loadPosts();
    }
  }, [session?.user?.email]);

  const handleDeletePost = async (postId: string) => {
    setIsDeleting(true);
    try {
      await postsAPI.delete(postId);
      setPosts(posts.filter(p => p.id !== postId));
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

  return (
    <div className="min-h-screen bg-background py-8 px-4 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <h1 className="font-display font-bold text-3xl text-foreground">
            All Posts
          </h1>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader size={40} className="text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Posts Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-elevated rounded-xl overflow-hidden group cursor-pointer"
                onClick={() => handleViewPost(post.id)}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-secondary">
                  <img
                    src={post.mediaUrls?.[0]}
                    alt={post.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="font-medium text-foreground line-clamp-2 mb-2">
                    {post.caption || 'Untitled post'}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Eye size={14} />
                        {post.viewCount || 0}
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
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPostToDelete(post.id);
                      }}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} className="text-red-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">You don't have any posts yet</p>
            <Link href="/create-post">
              <Button variant="gradient">Create Your First Post</Button>
            </Link>
          </div>
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
