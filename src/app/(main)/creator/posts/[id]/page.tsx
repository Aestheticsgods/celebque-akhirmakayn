'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft,
  Loader,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReelCard } from '@/components/feed/ReelCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { postsAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function ViewPostPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const postId = params.id as string;

  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const postData = await postsAPI.getById(postId);
        setPost(postData);
      } catch (err) {
        console.error('Failed to load post:', err);
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      loadPost();
    }
  }, [postId, session?.user?.id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await postsAPI.delete(postId);
      toast.success('Post deleted successfully');
      router.push('/creator/posts');
    } catch (err) {
      console.error('Failed to delete post:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const isPostOwner = post?.user?.email === session?.user?.email;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader size={40} className="text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Post not found'}</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 lg:p-6 pointer-events-none">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-muted transition-colors pointer-events-auto"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        {isPostOwner && (
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors pointer-events-auto"
          >
            <Trash2 size={24} className="text-red-400 hover:text-red-500" />
          </button>
        )}
      </div>

      {/* Reel Card */}
      <ReelCard 
        post={post} 
        isActive={true}
        isOwner={isPostOwner}
      />

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
