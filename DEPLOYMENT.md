# legaltypingtest.online Deployment Guide

## Critical security first

You pasted live secrets in chat. Before production, rotate/recreate:

- Supabase service role key
- Supabase database password / connection string
- Razorpay key secret
- Admin password

Do not commit real secrets to GitHub.

## Accounts needed

- Supabase: PostgreSQL database + Storage bucket `passage-pdfs`
- Razorpay: payment gateway for Rs. 100 lifetime payment
- Render: Node/Express backend hosting
- Vercel: React frontend hosting
- Domain DNS provider: legaltypingtest.online

## Supabase setup

1. Open Supabase project.
2. Go to SQL Editor.
3. Run `supabase/schema.sql` from this repo.
4. Go to Storage.
5. Create bucket: `passage-pdfs`.
6. Keep bucket private.

Required env values:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
SUPABASE_STORAGE_BUCKET=passage-pdfs
```

## Generate secure values

JWT secret:

```bash
openssl rand -hex 32
```

Admin bcrypt password hash:

```bash
cd server
node -e "import('bcryptjs').then(b=>console.log(b.default.hashSync('YOUR_ADMIN_PASSWORD', 10)))"
```

## Render backend

Create a new Render Web Service from this repo.

Settings:

```text
Root Directory: server
Build Command: npm install
Start Command: npm start
Node: >=20
```

Environment variables:

```env
NODE_ENV=production
FRONTEND_URL=https://legaltypingtest.online
EXTRA_CORS_ORIGINS=https://www.legaltypingtest.online
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=passage-pdfs
DATABASE_URL=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

After deployment, copy the Render backend URL. Example:

```text
https://legaltypingtest-api.onrender.com
```

## Vercel frontend

Create Vercel project from this repo.

Settings:

```text
Root Directory: client
Build Command: npm run build
Output Directory: dist
```

Environment variables:

```env
VITE_API_BASE_URL=https://YOUR_RENDER_BACKEND_URL/api
VITE_RAZORPAY_KEY_ID=YOUR_RAZORPAY_KEY_ID
```

## Domain: legaltypingtest.online

In Vercel:

1. Project Settings -> Domains
2. Add `legaltypingtest.online`
3. Add `www.legaltypingtest.online`
4. Vercel will show DNS records.
5. Add those DNS records in your domain provider.

Typical records are one `A` record for root and one `CNAME` for `www`, but use exactly what Vercel shows.

## Razorpay webhook

After backend is live, create Razorpay webhook:

```text
https://YOUR_RENDER_BACKEND_URL/api/payments/webhook
```

Enable events:

- payment.captured
- payment.failed
- order.paid

## Current status of this repo

The repo is prepared for production configuration and has schema/env/deploy files.
The active data layer is still SQLite for local development. The next implementation step is replacing the route database calls with Supabase/PostgreSQL and moving PDF upload/download to Supabase Storage.
