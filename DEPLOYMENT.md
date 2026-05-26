# legaltypingtest.online Deployment Guide

## Security First

Rotate any secrets that were shared in chat or committed anywhere outside Render/Supabase/Vercel:

- Supabase service role key
- Supabase database password / connection string
- Cashfree key secret
- Admin password
- JWT secret

Do not commit real secrets to GitHub.

## Accounts Needed

- Supabase: PostgreSQL database + private Storage bucket `passage-pdfs`
- Cashfree: payment gateway for Rs. 100 lifetime payment
- Render: Node/Express backend hosting
- Vercel: React frontend hosting
- Domain DNS provider: `legaltypingtest.online`

## Supabase Setup

1. Open Supabase project.
2. Go to Storage.
3. Create bucket: `passage-pdfs`.
4. Keep bucket private.
5. The backend now creates required PostgreSQL tables automatically on startup, but you can still run `supabase/schema.sql` manually if needed.

Required backend env values:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
SUPABASE_STORAGE_BUCKET=passage-pdfs
```

## Generate Secure Values

JWT secret:

```bash
openssl rand -hex 32
```

Admin bcrypt password hash:

```bash
cd server
node -e "import('bcryptjs').then(b=>console.log(b.default.hashSync('YOUR_ADMIN_PASSWORD', 10)))"
```

## Render Backend

Create or update the Render Web Service from this repo.

Settings:

```text
Root Directory: server
Build Command: npm install
Start Command: npm start
Node: 20
```

Environment variables:

```env
NODE_ENV=production
FRONTEND_URL=https://www.legaltypingtest.online
EXTRA_CORS_ORIGINS=https://legaltypingtest.online
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=passage-pdfs
DATABASE_URL=
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
CASHFREE_ENV=sandbox
ALLOW_MOCK_PAYMENTS=false
```

The backend is PostgreSQL/Supabase-only. If `DATABASE_URL`, `SUPABASE_URL`, or `SUPABASE_SERVICE_ROLE_KEY` is missing, it should fail loudly instead of saving data locally.

## Vercel Frontend

Create or update the Vercel project from this repo.

Settings:

```text
Root Directory: client
Build Command: npm run build
Output Directory: dist
```

Environment variables:

```env
VITE_API_BASE_URL=https://YOUR_RENDER_BACKEND_URL/api
```

## Domain: legaltypingtest.online

In Vercel:

1. Project Settings -> Domains
2. Add `legaltypingtest.online`
3. Add `www.legaltypingtest.online`
4. Add the DNS records Vercel gives you at your domain provider.

## Data Flow

- Student users are saved in PostgreSQL table `users`.
- Admin uploaded PDF metadata is saved in PostgreSQL table `pdfs`.
- PDF files are saved in Supabase Storage bucket `passage-pdfs`.
- Manual passages are saved in PostgreSQL table `passages`.
- Student results/history are saved in PostgreSQL table `test_results`.
- PDF downloads use signed Supabase Storage URLs.
