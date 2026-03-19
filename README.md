# Celebque - Creator Platform

A modern content creation platform built with Next.js, where creators can share content and users can discover and subscribe to their favorite creators.

## Prerequisites

- Node.js 20+ 
- npm or yarn
- MySQL 8+ (Prisma)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Anir4/Celeb.git
cd Celeb
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory with the required variables.

You can start from:

```bash
cp .env.example .env
```

Minimal required for local/dev:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/celebque"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (optional for Google sign-in)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**Note:** Generate `NEXTAUTH_SECRET` using:
```bash
openssl rand -base64 32
```

### 4. Setup Prisma & Database

#### Initialize the Database Schema

```bash
npx prisma migrate dev --name init
```

For production, use:

```bash
npm run db:migrate
```

#### Seed the Database (Optional)

To populate the database with sample data:

```bash
npx prisma db seed
```

#### View Database with Prisma Studio

To browse and manage your database graphically:

```bash
npx prisma studio
```

This opens a UI at `http://localhost:5555` where you can view and edit database records.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- src/app: Next.js App Router pages
- src/app/(auth): Authentication pages (login, signup)
- src/app/(main): Main protected app routes
- src/app/api: API routes
- src/components: React components
- src/components/layout: Layout components
- src/components/feed: Feed components
- src/components/ui: Reusable UI components
- src/contexts: React contexts
- src/lib: Utility modules
- src/types: TypeScript types
- src/middleware.ts: Route protection middleware
- prisma/schema.prisma: Database schema
- prisma/migrations: Prisma migration history

## Features

- User authentication (email/password and Google OAuth)
- Creator dashboard
- Content discovery feed
- Subscriptions and payments
- Creator profiles
- Messages and notifications
- Session management with NextAuth
- Route protection and authorization
- Responsive design
- Dark mode support

## Authentication

This project uses [NextAuth.js](https://next-auth.js.org/) for authentication with:
- Credentials provider (Email/Password)
- Google OAuth provider
- JWT-based session management
- Automatic route protection via middleware

## Database

The project uses [Prisma](https://www.prisma.io/) ORM with MySQL. Key features:
- Type-safe database queries
- Automatic migrations
- Database studio for visualization
- Seed scripts for sample data

### Common Prisma Commands

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# View database structure
npx prisma studio

# Generate Prisma Client (usually automatic)
npx prisma generate

# Reset database (destructive)
npx prisma migrate reset

# Format Prisma schema
npx prisma format
```

## Build for Production

```bash
npm run db:migrate
npm run build
npm start
```

## Hostinger VPS Deployment

Use Hostinger VPS (not shared hosting) for this app.

### Server prerequisites

- Ubuntu 22.04+
- Node.js 20+
- MySQL 8+
- Nginx
- PM2

### Deploy steps

```bash
git clone <your-repo-url> /var/www/celebque
cd /var/www/celebque
npm ci
cp .env.example .env
nano .env
npm run db:migrate
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### Required production environment variables

- DATABASE_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- NEXT_PUBLIC_APP_URL
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_MOCK_MODE=false

If Google login is not used, keep `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` empty.

### Nginx reverse proxy

```nginx
server {
  listen 80;
  server_name your-domain.com www.your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### SSL certificate

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Stripe webhook setup

Create a Stripe webhook endpoint:

- URL: `https://your-domain.com/api/stripe/webhook`

Subscribe to at least:

- checkout.session.completed
- invoice.payment_succeeded
- customer.subscription.deleted
- account.updated

Copy the webhook secret into `STRIPE_WEBHOOK_SECRET`.

### Redeploy updates

```bash
cd /var/www/celebque
git pull
npm ci
npm run db:migrate
npm run build
pm2 restart celebque
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS](https://tailwindcss.com)

## License

MIT
