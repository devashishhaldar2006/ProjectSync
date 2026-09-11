# Deployment Checklist & Production Environment Setup

This document contains everything needed to deploy the project to production.

---

## 1. Quick Database Setup (Free Managed PostgreSQL)
Because the app requires PostgreSQL with Prisma, create a free database:
- **Option A: [Neon.tech](https://neon.tech)** (Recommended - 30 seconds setup, free tier, instant serverless Postgres)
- **Option B: [Supabase.com](https://supabase.com)** (Free tier PostgreSQL)

Once created, copy the `Connection String` (starts with `postgresql://...`).

---

## 2. Backend Environment Variables (Render / Railway)
Set these in your cloud backend dashboard (e.g. [Render.com](https://render.com) under **Environment**):

| Key | Value / Instructions |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `DATABASE_URL` | *Your hosted database connection string from Step 1* |
| `CLIENT_URL` | *Your Vercel URL (e.g., `https://projectsync-yourname.vercel.app`)* |
| `JWT_ACCESS_SECRET` | `0dac12ee6508bdc9a026275cffbcdc659c31ad53d94854775eb51cfc4faa2af7` |
| `JWT_REFRESH_SECRET` | `08f68798f0be87c779010deaff7c698f4e4ff15e4019714bb941cb6ad4a5105f` |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN_DAYS` | `7` |

> **Render Settings Summary**:
> - **Root Directory**: `server`
> - **Build Command**: `npm install && npm run build && npx prisma generate`
> - **Start Command**: `npm run start`

---

## 3. Frontend Environment Variables (Vercel)
Set this in your Vercel project under **Settings → Environment Variables**:

| Key | Value / Instructions |
| :--- | :--- |
| `VITE_API_URL` | *Your deployed backend URL (e.g. `https://projectsync-api.onrender.com`)* |

> **Vercel Settings Summary**:
> - **Root Directory**: `client`
> - **Framework Preset**: `Vite` (auto-detected)
> - **Build Command**: `npm run build`
> - **Output Directory**: `dist`
