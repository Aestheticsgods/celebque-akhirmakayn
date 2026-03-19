# Hostinger Deployment Guide (VPS)

This project is now prepared for Node.js production deployment on Hostinger VPS.

## 1) Server prerequisites

- Ubuntu 22.04+ VPS
- Node.js 20+
- MySQL 8+
- Nginx
- PM2

## 2) Clone and install

```bash
git clone <your-repo-url> /var/www/celebque
cd /var/www/celebque
npm ci
```

## 3) Environment

Copy and fill production values:

```bash
cp .env.example .env
nano .env
```

Required keys:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_MOCK_MODE=false`

If you do not use Google login, leave `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` empty.

## 4) Database migration

```bash
npm run db:migrate
```

## 5) Build and run

```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## 6) Nginx reverse proxy

Example config:

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

Then:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7) SSL (Let's Encrypt)

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 8) Stripe webhook (production)

In Stripe dashboard, create endpoint:

- URL: `https://your-domain.com/api/stripe/webhook`

Subscribe to events at least:
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `customer.subscription.deleted`
- `account.updated`

Copy webhook secret to `STRIPE_WEBHOOK_SECRET`.

## 9) Updates / redeploy

```bash
cd /var/www/celebque
git pull
npm ci
npm run db:migrate
npm run build
pm2 restart celebque
```

## Notes

- `output: 'standalone'` is enabled for production optimization.
- `GoogleProvider` is now optional and only loaded when its env keys exist.
- Avoid running with `STRIPE_MOCK_MODE=true` in production.
