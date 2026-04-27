// =====================================================
// USER & AUTH TYPES
// =====================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  image?: string;
  bio?: string;
  role: 'USER' | 'CREATOR' | 'ADMIN';
  isCreator: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// CREATOR TYPES
// =====================================================

export interface Creator {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  subscriptionFee: number;
  monthlyRevenue: number;
  isVerified: boolean;
  category?: string;
  website?: string;
  postCount?: number;
  subscriberCount?: number;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// POST & CONTENT TYPES
// =====================================================

export interface Post {
  id: string;
  userId: string;
  creatorId: string;
  creator?: Creator;
  user?: User;
  caption?: string;
  content?: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video' | 'mixed';
  visibility: 'PUBLIC' | 'SUBSCRIBERS_ONLY' | 'PRIVATE';
  isLocked: boolean;
  isPinned: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user?: User;
  content: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Like {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  createdAt: string;
}

// =====================================================
// SOCIAL TYPES
// =====================================================

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  subscriberId: string;
  creatorId: string;
  creator?: Creator;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// MESSAGING TYPES
// =====================================================

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: string;
  lastMessageAt?: string;
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// WALLET & PAYMENT TYPES
// =====================================================

export interface Wallet {
  id: string;
  userId: string;
  balance: number; // in cents
  totalEarned: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'SUBSCRIPTION_PAYMENT' | 'WITHDRAWAL' | 'DEPOSIT' | 'REFUND' | 'TRANSFER';
  amount: number; // in cents
  description?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  relatedUserId?: string;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// NOTIFICATION TYPES
// =====================================================

export interface Notification {
  id: string;
  userId: string;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'SUBSCRIPTION' | 'MESSAGE' | 'MENTION';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// =====================================================
// ENUM TYPES
// =====================================================

export type UserRole = 'USER' | 'CREATOR' | 'ADMIN';
export type Visibility = 'PUBLIC' | 'SUBSCRIBERS_ONLY' | 'PRIVATE';
export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'SUBSCRIPTION' | 'MESSAGE' | 'MENTION';
export type TransactionType = 'SUBSCRIPTION_PAYMENT' | 'WITHDRAWAL' | 'DEPOSIT' | 'REFUND' | 'TRANSFER';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
