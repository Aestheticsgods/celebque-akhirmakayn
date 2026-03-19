# API Testing Guide

## 🧪 Testing the CelebNext APIs

The application is now running with all APIs connected to the PostgreSQL database. Here's how to test them.

---

## 🚀 Server Status

**Development Server:** `http://localhost:3000`

To start the server if not already running:
```bash
npm run dev
```

---

## 📝 API Endpoints

All endpoints return JSON. Dynamic route parameters use Next.js 16 Promise-based params.

### 1. Creator Endpoints

#### GET /api/creators
Fetch all creators with pagination and search
```bash
curl http://localhost:3000/api/creators
curl "http://localhost:3000/api/creators?page=1&limit=10"
```

#### GET /api/creators/[id]
Fetch a specific creator
```bash
curl http://localhost:3000/api/creators/{creator-id}
```

#### PUT /api/creators/[id]
Update creator profile (requires authentication)
```bash
curl -X PUT http://localhost:3000/api/creators/{creator-id} \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "New Name",
    "bio": "Creator bio",
    "subscriptionFee": 499
  }'
```

#### DELETE /api/creators/[id]
Delete creator profile (requires authentication)
```bash
curl -X DELETE http://localhost:3000/api/creators/{creator-id}
```

---

### 2. Post Endpoints

#### GET /api/posts
Fetch feed posts with filtering
```bash
curl http://localhost:3000/api/posts
curl "http://localhost:3000/api/posts?page=1&limit=20"
curl "http://localhost:3000/api/posts?visibility=PUBLIC"
```

#### POST /api/posts
Create a new post (requires authentication)
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Check this out!",
    "content": "Post content",
    "mediaUrls": ["https://example.com/image.jpg"],
    "mediaType": "image",
    "visibility": "PUBLIC"
  }'
```

#### GET /api/posts/[id]
Fetch a specific post
```bash
curl http://localhost:3000/api/posts/{post-id}
```

#### PUT /api/posts/[id]
Update a post (requires authentication)
```bash
curl -X PUT http://localhost:3000/api/posts/{post-id} \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Updated caption",
    "visibility": "SUBSCRIBERS_ONLY"
  }'
```

#### DELETE /api/posts/[id]
Delete a post (requires authentication)
```bash
curl -X DELETE http://localhost:3000/api/posts/{post-id}
```

---

### 3. Comment Endpoints

#### GET /api/comments
Fetch comments (usually by post ID)
```bash
curl "http://localhost:3000/api/comments?postId={post-id}"
```

#### POST /api/comments
Create a comment (requires authentication)
```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "{post-id}",
    "content": "Great post!"
  }'
```

#### GET /api/comments/[id]
Fetch a specific comment
```bash
curl http://localhost:3000/api/comments/{comment-id}
```

#### PUT /api/comments/[id]
Update a comment (requires authentication)
```bash
curl -X PUT http://localhost:3000/api/comments/{comment-id} \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated comment"}'
```

#### DELETE /api/comments/[id]
Delete a comment (requires authentication)
```bash
curl -X DELETE http://localhost:3000/api/comments/{comment-id}
```

---

### 4. Like Endpoints

#### GET /api/likes/[id]
Check if post/comment is liked by user
```bash
curl http://localhost:3000/api/likes/{post-or-comment-id}
```

#### POST /api/likes
Add a like (requires authentication)
```bash
curl -X POST http://localhost:3000/api/likes \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "{post-id}"
  }'
```

#### DELETE /api/likes/[id]
Remove a like (requires authentication)
```bash
curl -X DELETE http://localhost:3000/api/likes/{post-or-comment-id}
```

---

### 5. Follow Endpoints

#### GET /api/follows/[id]
Check if following a creator
```bash
curl http://localhost:3000/api/follows/{creator-id}
```

#### POST /api/follows
Follow a creator (requires authentication)
```bash
curl -X POST http://localhost:3000/api/follows \
  -H "Content-Type: application/json" \
  -d '{"followingId": "{creator-id}"}'
```

#### DELETE /api/follows/[id]
Unfollow a creator (requires authentication)
```bash
curl -X DELETE http://localhost:3000/api/follows/{creator-id}
```

---

### 6. Subscription Endpoints

#### GET /api/subscriptions
Fetch user's subscriptions
```bash
curl http://localhost:3000/api/subscriptions
```

#### POST /api/subscriptions
Subscribe to a creator (requires authentication)
```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"creatorId": "{creator-id}"}'
```

#### GET /api/subscriptions/[id]
Check subscription status
```bash
curl http://localhost:3000/api/subscriptions/{subscription-id}
```

#### DELETE /api/subscriptions/[id]
Cancel subscription (requires authentication)
```bash
curl -X DELETE http://localhost:3000/api/subscriptions/{subscription-id}
```

---

### 7. Message Endpoints

#### GET /api/messages
Fetch user's messages
```bash
curl http://localhost:3000/api/messages
curl "http://localhost:3000/api/messages?conversationId={conversation-id}"
```

#### POST /api/messages
Send a message (requires authentication)
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "{conversation-id}",
    "receiverId": "{user-id}",
    "content": "Hello!"
  }'
```

#### GET /api/messages/[id]
Fetch a specific message
```bash
curl http://localhost:3000/api/messages/{message-id}
```

#### DELETE /api/messages/[id]
Delete a message (requires authentication)
```bash
curl -X DELETE http://localhost:3000/api/messages/{message-id}
```

---

### 8. Notification Endpoints

#### GET /api/notifications
Fetch user's notifications
```bash
curl http://localhost:3000/api/notifications
```

#### GET /api/notifications/[id]
Fetch a specific notification
```bash
curl http://localhost:3000/api/notifications/{notification-id}
```

#### PUT /api/notifications/[id]
Mark notification as read (requires authentication)
```bash
curl -X PUT http://localhost:3000/api/notifications/{notification-id} \
  -H "Content-Type: application/json" \
  -d '{"isRead": true}'
```

#### DELETE /api/notifications/[id]
Delete a notification (requires authentication)
```bash
curl -X DELETE http://localhost:3000/api/notifications/{notification-id}
```

---

### 9. Wallet Endpoints

#### GET /api/wallet
Fetch user's wallet
```bash
curl http://localhost:3000/api/wallet
```

#### POST /api/wallet/withdraw
Withdraw from wallet (requires authentication)
```bash
curl -X POST http://localhost:3000/api/wallet/withdraw \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000}'
```

---

## 🔐 Authentication

Most endpoints require NextAuth authentication. The application uses:
- **Session Tokens:** Stored in HTTP-only cookies
- **Provider:** Configured in `src/app/api/auth/[...nextauth]/route.ts`

For testing authenticated endpoints:
1. Sign in at `http://localhost:3000/signup`
2. Session cookie is automatically set
3. Make requests from authenticated browser

For curl testing with auth, you would need to:
1. Manually extract session token
2. Include in Authorization header (if implemented)

---

## 📊 Database Queries

To verify data is being stored, use Prisma Studio:

```bash
npx prisma studio
```

This opens an interactive database explorer at `http://localhost:5555`

---

## 🧪 Testing Workflow

1. **Start Server**
   ```bash
   npm run dev
   ```

2. **Open Browser**
   ```
   http://localhost:3000
   ```

3. **Sign Up/Login**
   - Create account at `/signup`
   - Explore pages to trigger API calls

4. **Monitor Logs**
   - Check terminal for API request logs
   - Check browser DevTools Network tab

5. **Use Prisma Studio**
   ```bash
   npx prisma studio
   ```
   - View/edit database records directly

---

## ✅ Expected API Responses

### Success Response
```json
{
  "id": "abc123",
  "name": "Example",
  "createdAt": "2025-02-10T00:00:00Z",
  "updatedAt": "2025-02-10T00:00:00Z"
}
```

### List Response
```json
{
  "data": [
    {...},
    {...}
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### Error Response
```json
{
  "error": "Unauthorized",
  "message": "User not authenticated"
}
```

---

## 🐛 Troubleshooting

### 401 Unauthorized
- User is not authenticated
- Check session cookie
- Try signing in first

### 404 Not Found
- Resource doesn't exist
- Check the ID is correct
- Verify in Prisma Studio

### 500 Server Error
- Check server logs
- Verify database connection
- Check DATABASE_URL in .env.local

### Database Connection Failed
```bash
# Verify PostgreSQL is running
# Update DATABASE_URL if needed
npx prisma db push
```

---

## 📈 Performance Testing

For load testing:
```bash
# Using Apache Bench
ab -n 100 -c 10 http://localhost:3000/api/creators

# Using Artillery
npm install -g artillery
artillery quick --count 100 --num 10 http://localhost:3000/api/creators
```

---

## 🔍 Debugging

Enable verbose logging:
```bash
DEBUG=* npm run dev
```

Check TypeScript:
```bash
npx tsc --noEmit
```

Validate Prisma schema:
```bash
npx prisma validate
```

---

**Last Updated:** After API integration completion
**Status:** All endpoints operational and tested
