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

```
src/
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Authentication pages (login, signup)
│   ├── (main)/              # Main app routes (protected)
│   └── api/                 # API routes
├── components/               # React components
│   ├── layout/              # Layout components (sidebar, navbar)
│   ├── feed/                # Feed components
│   └── ui/                  # UI components (buttons, inputs, etc.)
├── contexts/                # React contexts (Auth, Sidebar)
├── lib/                     # Utility functions
├── types/                   # TypeScript type definitions
└── middleware.ts            # NextAuth middleware for route protection
prisma/
├── schema.prisma            # Database schema
└── migrations/              # Database migration history
```

## Features

- ✅ User Authentication (Email/Password & Google OAuth)
- ✅ Creator Dashboard
- ✅ Content Discovery Feed
- ✅ Subscriptions & Payments
- ✅ Creator Profiles
- ✅ Messages & Notifications
- ✅ Session Management with NextAuth
- ✅ Route Protection & Authorization
- ✅ Responsive Design
- ✅ Dark Mode Support

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

# Reset database (⚠️ destructive)
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

See full production instructions in [DEPLOY_HOSTINGER.md](DEPLOY_HOSTINGER.md).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS](https://tailwindcss.com)

## License

MIT
