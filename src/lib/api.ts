// API Helper functions for client-side calls

const rawApiBase = process.env.NEXT_PUBLIC_API_URL?.trim();
const API_BASE = rawApiBase
  ? rawApiBase.replace(/\/$/, '')
  : '/api';

// =====================================================
// UPLOADS
// =====================================================

export const uploadsAPI = {
  uploadMedia: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/uploads`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload media');
    return res.json();
  },
};

// =====================================================
// CREATORS
// =====================================================

export const creatorsAPI = {
  getAll: async (page = 1, limit = 20, search = '', category = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(category && { category }),
    });
    const res = await fetch(`${API_BASE}/creators?${params}`);
    if (!res.ok) throw new Error('Failed to fetch creators');
    return res.json();
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/creators/${id}`);
    if (!res.ok) throw new Error('Failed to fetch creator');
    return res.json();
  },

  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/creators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create creator');
    return res.json();
  },

  update: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/creators/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update creator');
    return res.json();
  },

  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/creators/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete creator');
    return res.json();
  },

  upgrade: async (displayName: string, bio: string, subscriptionPrice: number) => {
    const res = await fetch(`${API_BASE}/creator/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, bio, subscriptionPrice }),
    });
    if (!res.ok) throw new Error('Failed to upgrade to creator');
    return res.json();
  },

  getProfile: async () => {
    const res = await fetch(`${API_BASE}/creator/profile`);
    if (!res.ok) throw new Error('Failed to fetch creator profile');
    return res.json();
  },
};

// =====================================================
// POSTS
// =====================================================

export const postsAPI = {
  getAll: async (page = 1, limit = 20, creatorId = '', visibility = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(creatorId && { creatorId }),
      ...(visibility && { visibility }),
    });
    const res = await fetch(`${API_BASE}/posts?${params}`);
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/posts/${id}`);
    if (!res.ok) throw new Error('Failed to fetch post');
    return res.json();
  },

  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create post');
    return res.json();
  },

  update: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update post');
    return res.json();
  },

  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete post');
    return res.json();
  },
};

// =====================================================
// LIKES
// =====================================================

export const likesAPI = {
  checkStatus: async (postId: string) => {
    const res = await fetch(`${API_BASE}/likes/${postId}`);
    if (!res.ok) throw new Error('Failed to check like status');
    return res.json();
  },

  toggle: async (postId: string) => {
    const res = await fetch(`${API_BASE}/likes/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to toggle like');
    return res.json();
  },
};

// =====================================================
// COMMENTS
// =====================================================

export const commentsAPI = {
  getAll: async (postId: string, page = 1, limit = 10) => {
    const params = new URLSearchParams({
      postId,
      page: page.toString(),
      limit: limit.toString(),
    });
    const res = await fetch(`${API_BASE}/comments?${params}`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  },

  create: async (postId: string, content: string) => {
    const res = await fetch(`${API_BASE}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, content }),
    });
    if (!res.ok) throw new Error('Failed to create comment');
    return res.json();
  },

  update: async (id: string, content: string) => {
    const res = await fetch(`${API_BASE}/comments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to update comment');
    return res.json();
  },

  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/comments/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete comment');
    return res.json();
  },
};

// =====================================================
// SUBSCRIPTIONS
// =====================================================

export const subscriptionsAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/subscriptions`);
    if (!res.ok) throw new Error('Failed to fetch subscriptions');
    return res.json();
  },

  checkStatus: async (creatorId: string) => {
    const res = await fetch(`${API_BASE}/subscriptions/${creatorId}`);
    if (!res.ok) throw new Error('Failed to check subscription');
    return res.json();
  },

  subscribe: async (creatorId: string) => {
    const res = await fetch(`${API_BASE}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorId }),
    });
    if (!res.ok) throw new Error('Failed to subscribe');
    return res.json();
  },

  unsubscribe: async (creatorId: string) => {
    const res = await fetch(`${API_BASE}/subscriptions/${creatorId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to unsubscribe');
    return res.json();
  },
};

// =====================================================
// FOLLOWS
// =====================================================

export const followsAPI = {
  getFollowers: async (userId: string) => {
    const res = await fetch(`${API_BASE}/follows?userId=${userId}&type=followers`);
    if (!res.ok) throw new Error('Failed to fetch followers');
    return res.json();
  },

  getFollowing: async (userId: string) => {
    const res = await fetch(`${API_BASE}/follows?userId=${userId}&type=following`);
    if (!res.ok) throw new Error('Failed to fetch following');
    return res.json();
  },

  checkStatus: async (userId: string) => {
    const res = await fetch(`${API_BASE}/follows/${userId}`);
    if (!res.ok) throw new Error('Failed to check follow status');
    return res.json();
  },

  follow: async (userId: string) => {
    const res = await fetch(`${API_BASE}/follows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followingId: userId }),
    });
    if (!res.ok) throw new Error('Failed to follow user');
    return res.json();
  },

  unfollow: async (userId: string) => {
    const res = await fetch(`${API_BASE}/follows/${userId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to unfollow user');
    return res.json();
  },
};

// =====================================================
// MESSAGES
// =====================================================

export const messagesAPI = {
  getConversations: async () => {
    const res = await fetch(`${API_BASE}/messages`);
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  getConversationMessages: async (conversationId: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const res = await fetch(`${API_BASE}/messages/${conversationId}?${params}`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  sendMessage: async (receiverId: string, content: string) => {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId, content }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  deleteMessage: async (messageId: string) => {
    const res = await fetch(`${API_BASE}/messages/${messageId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete message');
    return res.json();
  },
};

// =====================================================
// NOTIFICATIONS
// =====================================================

export const notificationsAPI = {
  getAll: async (page = 1, limit = 20, unreadOnly = false) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(unreadOnly && { unreadOnly: 'true' }),
    });
    const res = await fetch(`${API_BASE}/notifications?${params}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  markAsRead: async (notificationId: string) => {
    const res = await fetch(`${API_BASE}/notifications/${notificationId}`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
  },

  delete: async (notificationId: string) => {
    const res = await fetch(`${API_BASE}/notifications/${notificationId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete notification');
    return res.json();
  },
};

// =====================================================
// WALLET
// =====================================================

export const walletAPI = {
  getWallet: async () => {
    const res = await fetch(`${API_BASE}/wallet`);
    if (!res.ok) throw new Error('Failed to fetch wallet');
    return res.json();
  },

  createTransaction: async (type: string, amount: number, description = '') => {
    const res = await fetch(`${API_BASE}/wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, amount, description }),
    });
    if (!res.ok) throw new Error('Failed to create transaction');
    return res.json();
  },
};
