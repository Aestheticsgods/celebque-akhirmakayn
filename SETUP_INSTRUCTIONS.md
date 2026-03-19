# Quick Start: Database Setup & Migration

## Prerequisites

- PostgreSQL database running
- Node.js installed
- Project dependencies installed (`npm install`)

## Step 1: Configure Database Connection

Edit `.env` file in project root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/celebnext"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-key-here"

# API
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

Replace:
- `username` - Your PostgreSQL username
- `password` - Your PostgreSQL password
- `localhost` - Your database host (default: localhost)
- `5432` - Your database port (default: 5432)
- `celebnext` - Your database name

## Step 2: Generate Prisma Client

```bash
npx prisma generate
```

## Step 3: Create Migration

```bash
# Create and run migration
npx prisma migrate dev --name init

# Or if you just want to push the schema without creating migration
npx prisma db push
```

This will:
- Create all tables in your PostgreSQL database
- Set up relationships
- Create indexes

## Step 4: Verify Setup

```bash
# Open Prisma Studio to view database
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can:
- View all tables
- Create test records
- Inspect data
- Run queries

## Step 5: Start the Application

```bash
# Start development server
npm run dev
```

Visit `http://localhost:3000`

---

## Common Issues

### Issue: "Can't reach database server"
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure username/password are correct

### Issue: "Column does not exist"
- Run: `npx prisma migrate dev --name fix`
- Or: `npx prisma db push --force-reset` (WARNING: Deletes all data)

### Issue: "Need to reset database"
```bash
# Reset and reseed (loses all data)
npx prisma migrate reset
```

---

## Testing APIs

### Using cURL

```bash
# Get all creators
curl http://localhost:3000/api/creators

# Get single creator
curl http://localhost:3000/api/creators/[creator-id]

# Get all posts
curl http://localhost:3000/api/posts

# Get creator followers
curl "http://localhost:3000/api/follows?userId=[user-id]&type=followers"
```

### Using Postman/REST Client

1. Create collection in Postman
2. Add requests for each endpoint
3. Set authentication headers if needed
4. Test endpoints

### Using React Query in Components

```typescript
import { useQuery } from '@tanstack/react-query';
import { creatorsAPI } from '@/lib/api';

function CreatorsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['creators'],
    queryFn: () => creatorsAPI.getAll(1, 20),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data?.map(creator => (
        <div key={creator.id}>{creator.displayName}</div>
      ))}
    </div>
  );
}
```

---

## Seeding Database (Optional)

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
    },
  });

  // Create test creator
  const creator = await prisma.creator.create({
    data: {
      userId: user.id,
      displayName: 'Test Creator',
      username: 'testcreator',
      bio: 'A test creator',
      subscriptionFee: 1000, // $10.00
      category: 'music',
    },
  });

  console.log('Seeded database with test data');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

Run with:
```bash
npx prisma db seed
```

---

## Database Maintenance

### Backup Database
```bash
# PostgreSQL backup
pg_dump celebnext > backup.sql

# Restore from backup
psql celebnext < backup.sql
```

### View Database Stats
```bash
# Open Prisma Studio
npx prisma studio

# Or use PostgreSQL directly
psql -U username -d celebnext
```

### Common Queries

```sql
-- Get creators with most subscribers
SELECT c.*, COUNT(s.id) as subscriber_count
FROM "Creator" c
LEFT JOIN "Subscription" s ON c.id = s."creatorId"
GROUP BY c.id
ORDER BY subscriber_count DESC;

-- Get top posts by likes
SELECT * FROM "Post"
ORDER BY "likeCount" DESC
LIMIT 10;

-- Get user engagement
SELECT u.id, u.name, COUNT(DISTINCT p.id) as post_count,
       COUNT(DISTINCT c.id) as comment_count
FROM "User" u
LEFT JOIN "Post" p ON u.id = p."userId"
LEFT JOIN "Comment" c ON u.id = c."userId"
GROUP BY u.id;
```

---

## Next Steps

1. ✅ Database configured and migrated
2. ✅ API endpoints ready
3. Next: Update components to use database APIs instead of mock data
4. Then: Add error handling and loading states
5. Finally: Implement file uploads for media

---

## Useful Commands

```bash
# Generate Prisma types
npx prisma generate

# View database schema
npx prisma studio

# Run migrations
npx prisma migrate dev

# Push schema without migration
npx prisma db push

# Reset database (DELETES DATA)
npx prisma migrate reset

# Format schema
npx prisma format

# Validate schema
npx prisma validate
```

---

For more help, see [DATABASE_GUIDE.md](./DATABASE_GUIDE.md)
