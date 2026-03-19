# Real-World Usage Examples

Complete examples for integrating the database and APIs into your CelebNext application.

---

## 📚 Table of Contents

1. [Components with Real Data](#components-with-real-data)
2. [Pages Implementation](#pages-implementation)
3. [Form Handling](#form-handling)
4. [Error Handling](#error-handling)
5. [Real-time Updates](#real-time-updates)

---

## Components with Real Data

### 1. Creators Discovery Component

**File:** `src/components/layout/CreatorDiscovery.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { creatorsAPI } from '@/lib/api';
import { Creator } from '@/types';
import { useState } from 'react';

export function CreatorDiscovery() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['creators', page, search, category],
    queryFn: () => creatorsAPI.getAll(page, 20, search, category),
  });

  if (isLoading) return <div>Loading creators...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-4">
        <input
          placeholder="Search creators..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-4 py-2 border rounded"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Categories</option>
          <option value="music">Music</option>
          <option value="art">Art</option>
          <option value="fitness">Fitness</option>
        </select>
      </div>

      {/* Creators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data?.data?.map((creator: Creator) => (
          <CreatorCard key={creator.id} creator={creator} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page} of {data?.pagination?.pages}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page >= (data?.pagination?.pages || 1)}
        >
          Next
        </button>
      </div>

      {isFetching && <div>Updating...</div>}
    </div>
  );
}

function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <div className="p-4 border rounded-lg hover:shadow-lg transition">
      <img
        src={creator.avatar || '/default-avatar.png'}
        alt={creator.displayName}
        className="w-full h-40 object-cover rounded"
      />
      <h3 className="mt-2 font-bold">{creator.displayName}</h3>
      <p className="text-sm text-gray-600">@{creator.username}</p>
      <p className="text-sm mt-2">{creator.bio}</p>
      <div className="flex justify-between mt-3 text-sm">
        <span>{creator.subscriberCount} subscribers</span>
        <span>{creator.postCount} posts</span>
      </div>
      <button className="w-full mt-3 bg-blue-500 text-white py-2 rounded">
        Subscribe - ${creator.subscriptionFee / 100}
      </button>
    </div>
  );
}
```

---

### 2. Feed with Posts Component

**File:** `src/components/feed/Feed.tsx`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsAPI, likesAPI, commentsAPI } from '@/lib/api';
import { Post } from '@/types';
import { useState } from 'react';

export function Feed() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => postsAPI.getAll(page, 20),
  });

  const likeMutation = useMutation({
    mutationFn: (postId: string) => likesAPI.toggle(postId),
    onSuccess: () => {
      // Refresh posts to get updated like counts
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  if (isLoading) return <div>Loading feed...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {data?.data?.map((post: Post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={() => likeMutation.mutate(post.id)}
          isLiking={likeMutation.isPending}
        />
      ))}

      {/* Pagination */}
      {data?.pagination?.pages > 1 && (
        <div className="flex justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= data.pagination.pages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function PostCard({ post, onLike, isLiking }: any) {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="border rounded-lg p-4 bg-white">
      {/* Post Header */}
      <div className="flex items-center mb-4">
        <img
          src={post.user?.image || '/default-avatar.png'}
          alt={post.user?.name}
          className="w-10 h-10 rounded-full"
        />
        <div className="ml-3">
          <p className="font-bold">{post.user?.name}</p>
          <p className="text-sm text-gray-500">@{post.creator?.username}</p>
        </div>
      </div>

      {/* Post Content */}
      {post.caption && <p className="mb-3">{post.caption}</p>}

      {/* Media */}
      {post.mediaUrls?.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          {post.mediaUrls.map((url: string, idx: number) => (
            <img
              key={idx}
              src={url}
              alt="post"
              className="w-full h-40 object-cover rounded"
            />
          ))}
        </div>
      )}

      {/* Engagement */}
      <div className="flex justify-between py-3 border-t border-b text-gray-600">
        <span>{post.likeCount} likes</span>
        <span>{post.commentCount} comments</span>
        <span>{post.shareCount} shares</span>
      </div>

      {/* Actions */}
      <div className="flex justify-between mt-3">
        <button
          onClick={onLike}
          disabled={isLiking}
          className="text-gray-600 hover:text-red-500"
        >
          ❤️ Like
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-gray-600 hover:text-blue-500"
        >
          💬 Comment
        </button>
        <button className="text-gray-600 hover:text-green-500">
          📤 Share
        </button>
      </div>

      {/* Comments Section */}
      {showComments && <CommentsSection postId={post.id} />}
    </div>
  );
}

function CommentsSection({ postId }: { postId: string }) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentsAPI.getAll(postId),
  });

  const createCommentMutation = useMutation({
    mutationFn: (content: string) => commentsAPI.create(postId, content),
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  return (
    <div className="mt-4 border-t pt-4">
      <div className="space-y-3 mb-3">
        {data?.data?.map((comment: any) => (
          <div key={comment.id} className="text-sm">
            <strong>{comment.user?.name}</strong>
            <p className="text-gray-700">{comment.content}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-1 border rounded text-sm"
        />
        <button
          onClick={() => createCommentMutation.mutate(newComment)}
          disabled={!newComment || createCommentMutation.isPending}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Post
        </button>
      </div>
    </div>
  );
}
```

---

## Pages Implementation

### 3. Creator Profile Page

**File:** `src/app/(main)/creators/[id]/page.tsx`

```typescript
'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { creatorsAPI, subscriptionsAPI, postsAPI, followsAPI } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function CreatorPage() {
  const params = useParams();
  const creatorId = params.id as string;
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('posts');

  const { data: creator, isLoading } = useQuery({
    queryKey: ['creator', creatorId],
    queryFn: () => creatorsAPI.getById(creatorId),
  });

  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscription', creatorId],
    queryFn: () => subscriptionsAPI.checkStatus(creatorId),
    enabled: !!session,
  });

  const { data: followStatus } = useQuery({
    queryKey: ['follow', creatorId],
    queryFn: () => followsAPI.checkStatus(creatorId),
    enabled: !!session,
  });

  const { data: creatorPosts } = useQuery({
    queryKey: ['creator-posts', creatorId],
    queryFn: () => postsAPI.getAll(1, 20, creatorId),
  });

  const subscribeMutation = useMutation({
    mutationFn: () => subscriptionsAPI.subscribe(creatorId),
  });

  const followMutation = useMutation({
    mutationFn: () => followsAPI.follow(creatorId),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!creator) return <div>Creator not found</div>;

  const isCreator = session?.user?.id === creator.userId;

  return (
    <div>
      {/* Banner */}
      {creator.banner && (
        <img
          src={creator.banner}
          alt="banner"
          className="w-full h-64 object-cover"
        />
      )}

      {/* Profile Info */}
      <div className="max-w-4xl mx-auto -mt-16 relative px-4">
        <div className="flex justify-between items-end">
          <div>
            {creator.avatar && (
              <img
                src={creator.avatar}
                alt={creator.displayName}
                className="w-32 h-32 rounded-full border-4 border-white"
              />
            )}
            <h1 className="text-3xl font-bold mt-4">{creator.displayName}</h1>
            <p className="text-gray-600">@{creator.username}</p>
            {creator.isVerified && <span className="badge">✓ Verified</span>}
          </div>

          {/* Actions */}
          {session && !isCreator && (
            <div className="flex gap-2">
              <button
                onClick={() => subscribeMutation.mutate()}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                {subscriptionStatus?.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                {subscriptionStatus && !subscriptionStatus.isSubscribed && 
                  ` - $${creator.subscriptionFee / 100}`}
              </button>
              <button
                onClick={() => followMutation.mutate()}
                className="px-4 py-2 border rounded"
              >
                {followStatus?.isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-8 mt-4 text-gray-600">
          <div>
            <p className="text-2xl font-bold">{creator.subscriberCount}</p>
            <p>Subscribers</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{creator.postCount}</p>
            <p>Posts</p>
          </div>
          <div>
            <p className="text-2xl font-bold">${creator.monthlyRevenue / 100}</p>
            <p>Monthly Revenue</p>
          </div>
        </div>

        {/* Bio */}
        {creator.bio && (
          <p className="mt-4 text-lg">{creator.bio}</p>
        )}

        {/* Tabs */}
        <div className="mt-8 border-b flex gap-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`pb-2 ${activeTab === 'posts' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-2 ${activeTab === 'about' ? 'border-b-2 border-blue-500' : ''}`}
          >
            About
          </button>
        </div>

        {/* Content */}
        {activeTab === 'posts' && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            {creatorPosts?.data?.map((post: any) => (
              <div key={post.id} className="aspect-square rounded overflow-hidden">
                <img
                  src={post.mediaUrls?.[0] || '/placeholder.png'}
                  alt="post"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="mt-6">
            <p>{creator.bio}</p>
            {creator.website && (
              <a href={creator.website} className="text-blue-500 mt-2">
                {creator.website}
              </a>
            )}
            <p className="mt-2 text-gray-600">
              Category: {creator.category}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Form Handling

### 4. Create Post Form

**File:** `src/app/(main)/create-post/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { postsAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function CreatePostPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    caption: '',
    content: '',
    mediaUrls: [] as string[],
    mediaType: 'image',
    visibility: 'PUBLIC',
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');

  const createPostMutation = useMutation({
    mutationFn: (data) => postsAPI.create(data),
    onSuccess: () => {
      router.push('/home');
    },
  });

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleAddMedia = (url: string) => {
    setFormData(prev => ({
      ...prev,
      mediaUrls: [...prev.mediaUrls, url],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.caption && !formData.content) {
      alert('Please add a caption or content');
      return;
    }

    if (formData.mediaUrls.length === 0) {
      alert('Please add at least one image or video');
      return;
    }

    createPostMutation.mutate(formData as any);
  };

  if (!session) {
    return <div>Please log in to create a post</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create New Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Caption */}
        <div>
          <label className="block font-bold mb-2">Caption</label>
          <textarea
            value={formData.caption}
            onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
            placeholder="What's on your mind?"
            className="w-full p-3 border rounded h-24"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block font-bold mb-2">Content</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Add detailed content..."
            className="w-full p-3 border rounded h-24"
          />
        </div>

        {/* Media URLs */}
        <div>
          <label className="block font-bold mb-2">Media URLs</label>
          <div className="flex gap-2 mb-2">
            <input
              type="url"
              placeholder="Enter image or video URL"
              className="flex-1 p-2 border rounded"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMedia((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {formData.mediaUrls.map((url, idx) => (
              <div key={idx} className="relative">
                <img src={url} alt="preview" className="w-full rounded" />
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      mediaUrls: prev.mediaUrls.filter((_, i) => i !== idx),
                    }));
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="block font-bold mb-2">Visibility</label>
          <select
            value={formData.visibility}
            onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
            className="w-full p-2 border rounded"
          >
            <option value="PUBLIC">Public</option>
            <option value="SUBSCRIBERS_ONLY">Subscribers Only</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block font-bold mb-2">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add a tag and press Enter"
              className="flex-1 p-2 border rounded"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, idx) => (
              <span
                key={idx}
                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      tags: prev.tags.filter((_, i) => i !== idx),
                    }));
                  }}
                  className="text-blue-700 hover:text-blue-900"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createPostMutation.isPending}
            className="px-6 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {createPostMutation.isPending ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## Error Handling

### 5. Error Boundary Component

**File:** `src/components/ErrorBoundary.tsx`

```typescript
'use client';

import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
            <h2 className="font-bold">Something went wrong</h2>
            <p className="text-sm">{this.state.error?.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

---

## Real-time Updates

### 6. WebSocket for Live Updates (Future)

```typescript
// Example for future implementation
export function useRealtimeNotifications() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!session?.user?.id) return;

    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/notifications/${session.user.id}`
    );

    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    return () => ws.close();
  }, [session?.user?.id]);
}
```

---

**These examples should give you a solid starting point for integrating the database and APIs into your application!**
