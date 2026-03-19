# CelebNext Database & API Implementation Guide

## Overview

This document outlines the comprehensive database schema and API structure for the CelebNext creator platform. The database has been redesigned to support full CRUD operations with real data instead of mock data.

---

## Database Schema

### Core Models

#### 1. **User Model**
- User authentication and profile
- Support for creators and regular users
- Enhanced fields for social features

**Key Fields:**
- `id` (String - Primary Key)
- `email` (String - Unique)
- `username` (String - Unique)
- `name` (String)
- `image` (String - Profile picture)
- `bio` (String)
- `role` (Enum: USER, CREATOR, ADMIN)
- `isCreator` (Boolean)
- `isVerified` (Boolean)

**Relations:**
- `accounts` - OAuth accounts
- `sessions` - Active sessions
- `creator` - Creator profile (one-to-one)
- `posts` - User's posts
- `comments` - User's comments
- `likes` - User's likes
- `subscriptions` - User's subscriptions
- `followers` - Followers relation
- `following` - Following relation
- `sentMessages` - Messages sent
- `receivedMessages` - Messages received
- `wallet` - User's wallet
- `transactions` - Financial transactions
- `notifications` - User notifications

---

#### 2. **Creator Model**
- Creator-specific profile and settings
- Monetization information
- Verification status

**Key Fields:**
- `id` (String - Primary Key)
- `userId` (String - Foreign Key, Unique)
- `displayName` (String)
- `username` (String - Unique)
- `bio` (String)
- `avatar` (String)
- `banner` (String)
- `subscriptionFee` (Int - in cents)
- `monthlyRevenue` (Int - in cents)
- `isVerified` (Boolean)
- `category` (String - e.g., 'music', 'art', 'fitness')
- `website` (String)

**Relations:**
- `user` - Back-reference to User
- `posts` - Creator's posts
- `subscribers` - Users subscribed to this creator

---

#### 3. **Post Model**
- User-generated content
- Multiple media formats support
- Access control and visibility

**Key Fields:**
- `id` (String - Primary Key)
- `userId` (String - Foreign Key)
- `creatorId` (String - Foreign Key)
- `caption` (String)
- `content` (String)
- `mediaUrls` (String Array - URLs to images/videos)
- `mediaType` (String - 'image' | 'video' | 'mixed')
- `visibility` (Enum: PUBLIC, SUBSCRIBERS_ONLY, PRIVATE)
- `isLocked` (Boolean)
- `isPinned` (Boolean)
- `likeCount` (Int)
- `commentCount` (Int)
- `shareCount` (Int)
- `viewCount` (Int)
- `tags` (String Array)

**Relations:**
- `creator` - Creator relationship
- `user` - Post author
- `comments` - Comments on post
- `likes` - Likes on post

---

#### 4. **Comment Model**
- Post comments with engagement tracking
- Nested comment support through likes

**Key Fields:**
- `id` (String - Primary Key)
- `postId` (String - Foreign Key)
- `userId` (String - Foreign Key)
- `content` (String)
- `likeCount` (Int)

**Relations:**
- `post` - Parent post
- `user` - Comment author
- `likes` - Likes on comment

---

#### 5. **Like Model**
- Support for liking posts and comments
- Tracks engagement

**Key Fields:**
- `id` (String - Primary Key)
- `userId` (String - Foreign Key)
- `postId` (String - Foreign Key, Optional)
- `commentId` (String - Foreign Key, Optional)

**Unique Constraint:** `userId_postId_commentId` (prevents duplicate likes)

---

#### 6. **Social Models**

**Follow Model:**
- User-to-user following relationship
- `followerId` (String - Foreign Key)
- `followingId` (String - Foreign Key)
- Unique constraint: `followerId_followingId`

**Subscription Model:**
- Creator subscription tracking
- `subscriberId` (String - Foreign Key)
- `creatorId` (String - Foreign Key)
- `startDate` (DateTime)
- `endDate` (DateTime - Optional)
- `isActive` (Boolean)
- Unique constraint: `subscriberId_creatorId`

---

#### 7. **Messaging Models**

**Conversation Model:**
- Group conversations support
- `participants` (User[] - Many-to-many)
- `lastMessage` (String)
- `lastMessageAt` (DateTime)

**Message Model:**
- Individual messages
- `conversationId` (String - Foreign Key)
- `senderId` (String - Foreign Key)
- `receiverId` (String - Foreign Key)
- `content` (String)
- `isRead` (Boolean)

---

#### 8. **Wallet & Payment Models**

**Wallet Model:**
- User balance tracking
- `userId` (String - Foreign Key, Unique)
- `balance` (Int - in cents)
- `totalEarned` (Int - in cents)
- `totalSpent` (Int - in cents)

**Transaction Model:**
- Financial transaction history
- `userId` (String - Foreign Key)
- `type` (Enum: SUBSCRIPTION_PAYMENT, WITHDRAWAL, DEPOSIT, REFUND, TRANSFER)
- `amount` (Int - in cents)
- `status` (Enum: PENDING, COMPLETED, FAILED, CANCELLED)
- `description` (String)
- `relatedUserId` (String - Optional)

---

#### 9. **Notification Model**
- User notifications for activities
- `userId` (String - Foreign Key)
- `type` (Enum: LIKE, COMMENT, FOLLOW, SUBSCRIPTION, MESSAGE, MENTION)
- `title` (String)
- `message` (String)
- `relatedId` (String - ID of related entity)
- `relatedType` (String - Type of related entity)
- `isRead` (Boolean)

---

## API Endpoints

### Creators Endpoints

**GET `/api/creators`**
- Get all creators with pagination and filtering
- Query params: `page`, `limit`, `search`, `category`
- Returns: Paginated creator list with subscriber/post counts

**GET `/api/creators/:id`**
- Get single creator details
- Returns: Creator profile with stats

**POST `/api/creators`**
- Create new creator profile
- Body: `displayName`, `username`, `bio`, `subscriptionFee`, `category`, `website`
- Returns: New creator object

**PUT `/api/creators/:id`**
- Update creator profile
- Auth: Must be creator owner
- Body: Any updatable fields
- Returns: Updated creator

**DELETE `/api/creators/:id`**
- Delete creator profile
- Auth: Must be creator owner
- Returns: Success message

---

### Posts Endpoints

**GET `/api/posts`**
- Get all posts with filtering
- Query params: `page`, `limit`, `creatorId`, `visibility`
- Returns: Paginated posts with user and creator data

**GET `/api/posts/:id`**
- Get single post with comments
- Auto-increments view count
- Returns: Post with comments and like data

**POST `/api/posts`**
- Create new post
- Auth: Must be logged in creator
- Body: `caption`, `content`, `mediaUrls`, `mediaType`, `visibility`, `tags`
- Returns: Created post

**PUT `/api/posts/:id`**
- Update post
- Auth: Must be post owner
- Body: `caption`, `content`, `visibility`, `isLocked`, `isPinned`, `tags`
- Returns: Updated post

**DELETE `/api/posts/:id`**
- Delete post
- Auth: Must be post owner
- Returns: Success message

---

### Likes Endpoints

**GET `/api/likes/:id`** (Post ID)
- Check like status for authenticated user
- Returns: `{ likeCount, userLiked }`

**POST `/api/likes/:id`** (Post ID)
- Toggle like on post
- Creates notification for post creator if not already a liker
- Returns: `{ message, liked }`

---

### Comments Endpoints

**GET `/api/comments`**
- Get all comments for a post
- Query params: `postId`, `page`, `limit`
- Returns: Paginated comments with user data

**GET `/api/comments/:id`**
- Get single comment
- Returns: Comment with user data

**POST `/api/comments`**
- Create new comment
- Auth: Must be logged in
- Body: `postId`, `content`
- Returns: New comment with user data

**PUT `/api/comments/:id`**
- Update comment
- Auth: Must be comment owner
- Body: `content`
- Returns: Updated comment

**DELETE `/api/comments/:id`**
- Delete comment
- Auth: Must be comment owner
- Returns: Success message

---

### Subscriptions Endpoints

**GET `/api/subscriptions`**
- Get all active subscriptions for current user
- Auth: Required
- Returns: List of subscriptions with creator data

**GET `/api/subscriptions/:id`** (Creator ID)
- Check subscription status
- Returns: `{ subscriberCount, isSubscribed }`

**POST `/api/subscriptions`**
- Subscribe to a creator
- Auth: Required
- Body: `creatorId`
- Returns: New subscription

**DELETE `/api/subscriptions/:id`** (Creator ID)
- Unsubscribe from creator
- Auth: Required
- Returns: Success message

---

### Follows Endpoints

**GET `/api/follows`**
- Get followers or following list
- Query params: `userId`, `type` (followers|following)
- Returns: List of user objects

**GET `/api/follows/:id`** (User ID)
- Check if current user follows this user
- Returns: `{ isFollowing }`

**POST `/api/follows`**
- Follow a user
- Auth: Required
- Body: `followingId`
- Returns: New follow relationship

**DELETE `/api/follows/:id`** (User ID)
- Unfollow user
- Auth: Required
- Returns: Success message

---

### Messages Endpoints

**GET `/api/messages`**
- Get all conversations for current user
- Auth: Required
- Returns: List of conversations with last message

**GET `/api/messages/:id`** (Conversation ID)
- Get messages in conversation
- Auth: Required (must be participant)
- Query params: `page`, `limit`
- Auto-marks messages as read
- Returns: Paginated messages

**POST `/api/messages`**
- Send message to user
- Auth: Required
- Body: `receiverId`, `content`
- Creates or finds conversation
- Returns: New message

**DELETE `/api/messages/:id`** (Message ID)
- Delete message
- Auth: Must be message sender
- Returns: Success message

---

### Notifications Endpoints

**GET `/api/notifications`**
- Get user notifications
- Auth: Required
- Query params: `page`, `limit`, `unreadOnly`
- Returns: Paginated notifications with unread count

**GET `/api/notifications/:id`**
- Get single notification and mark as read
- Auth: Required
- Returns: Notification object

**PUT `/api/notifications/:id`**
- Mark notification as read
- Auth: Required
- Returns: Updated notification

**DELETE `/api/notifications/:id`**
- Delete notification
- Auth: Required
- Returns: Success message

---

### Wallet Endpoints

**GET `/api/wallet`**
- Get user wallet and recent transactions
- Auth: Required
- Returns: `{ wallet, recentTransactions }`

**POST `/api/wallet`**
- Create transaction
- Auth: Required
- Body: `type`, `amount`, `description`, `relatedUserId`
- Returns: New transaction

---

## TypeScript Types

All types are defined in `src/types/index.ts`:

```typescript
// User, Creator, Post, Comment, Like
// Follow, Subscription
// Conversation, Message
// Wallet, Transaction
// Notification
// API Response types
// Enums: UserRole, Visibility, NotificationType, TransactionType, TransactionStatus
```

---

## API Client Utilities

Helper functions available in `src/lib/api.ts`:

```typescript
// Import and use:
import {
  creatorsAPI,
  postsAPI,
  likesAPI,
  commentsAPI,
  subscriptionsAPI,
  followsAPI,
  messagesAPI,
  notificationsAPI,
  walletAPI,
} from '@/lib/api';

// Example usage:
const creators = await creatorsAPI.getAll(1, 20);
const posts = await postsAPI.getAll(1, 20, creatorId);
await likesAPI.toggle(postId);
```

---

## Getting Started

### 1. Install Prisma Dependencies
```bash
npm install @prisma/client
npm install -D prisma
```

### 2. Setup Database
```bash
# Update .env with PostgreSQL connection string
# DATABASE_URL="postgresql://user:password@localhost:5432/celebnext"

# Run migrations
npx prisma migrate dev --name init
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Seed Database (Optional)
Create `prisma/seed.ts` for initial data

### 5. Use APIs in Components
```typescript
import { creatorsAPI, postsAPI } from '@/lib/api';
import { useEffect, useState } from 'react';

export function CreatorsList() {
  const [creators, setCreators] = useState([]);

  useEffect(() => {
    creatorsAPI.getAll().then(data => setCreators(data.data));
  }, []);

  return (
    <div>
      {creators.map(creator => (
        <div key={creator.id}>{creator.displayName}</div>
      ))}
    </div>
  );
}
```

---

## Authentication

All protected endpoints require:
- Valid NextAuth session
- User email verification in `session.user.email`
- Ownership verification for personal resources

---

## Error Handling

Standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (ownership issue)
- `404` - Not Found
- `500` - Server Error

---

## Next Steps

1. **Run Migrations**: Update database with new schema
2. **Update Components**: Replace mock data with API calls
3. **Add Error Boundaries**: Handle API errors gracefully
4. **Implement Pagination**: Use pagination for large datasets
5. **Add Loading States**: Show loading UI during API calls
6. **File Upload**: Implement media upload for posts and avatars
7. **Real-time Updates**: Add WebSockets for notifications and messages
8. **Testing**: Write tests for API endpoints

---

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/celebnext
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Performance Optimization Tips

1. **Pagination**: Always paginate large datasets
2. **Indexing**: Database indexes on frequently queried fields
3. **Select**: Use Prisma `select` to only fetch needed fields
4. **Caching**: Implement React Query for client-side caching
5. **Rate Limiting**: Add rate limiting for API endpoints

---

## Support

For questions or issues with the implementation, refer to:
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [NextAuth.js](https://next-auth.js.org/)
