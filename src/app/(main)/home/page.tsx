'use client';

import { useRef, useEffect, useState } from 'react';
import { ReelCard } from '@/components/feed/ReelCard';

import { Post } from '@/types';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/posts');
        if (!response.ok) throw new Error('Failed to fetch posts');
        const data = await response.json();
        const postsArray = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : (data.posts && Array.isArray(data.posts) ? data.posts : []));
        setPosts(postsArray);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    // Add smooth scroll snap behavior
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Optional: Track scroll position for analytics
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto snap-y-mandatory hide-scrollbar"
    >
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">No posts yet. Follow creators to see their content!</p>
        </div>
      ) : (
        posts.map((post, index) => (
          <ReelCard key={post.id} post={post} />
        ))
      )}
    </div>
  );
}
