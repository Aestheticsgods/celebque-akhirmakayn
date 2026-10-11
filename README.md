# Celebque — Full-Stack Creator Platform

Celebque is a creator-platform application for publishing and discovering content, managing creator profiles and supporting subscription workflows. This repository contains the Next.js application and its server-side integrations.

**Repository:** [Aestheticsgods/celebque-akhirmakayn](https://github.com/Aestheticsgods/celebque-akhirmakayn)

## Application areas

- Creator profiles, content feeds and discovery
- User sign-in and protected application routes
- Creator dashboard, subscriptions, messaging and notifications
- Prisma data model and database-backed API routes
- Stripe payment integration

## Technology

- Next.js App Router, React and TypeScript
- MySQL and Prisma ORM
- NextAuth authentication
- Stripe integration
- Tailwind CSS and reusable interface components

## Requirements

- Node.js 20 or newer
- npm
- MySQL 8 or newer

## Local setup

```bash
git clone https://github.com/Aestheticsgods/celebque-akhirmakayn.git
cd celebque-akhirmakayn
npm install
```

Create a local `.env` file with the database, authentication and payment settings required by the application. Keep credentials out of version control. Generate an authentication secret with:

```bash
openssl rand -base64 32
```

Generate the Prisma client and apply the development schema:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

The production build command is `npm run build`. For deployment, configure the production environment and database migrations for your hosting platform before starting the server.

## Project layout

```text
src/app/       Pages, layouts and API routes
src/components/Shared application components
src/lib/       Authentication, database, payment and application helpers
prisma/        Database schema and migrations
public/        Static assets
```
