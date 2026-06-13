# i-Tamil Recruit — Backend

Node 20 + Express 5 + Prisma + MySQL 8 + Zod + JWT. Ships from `backend/` as a self-contained service.

## Quick start (local)

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Start MySQL via Docker (one-time download ~600 MB)
npm run db:up

# 3. Copy env template and tweak if needed
cp .env.example .env
# Generate two random JWT secrets:
#   openssl rand -hex 32
# Paste them into JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env

# 4. Create the database schema
npm run db:migrate -- --name init

# 5. Run the dev server (auto-reloads on file changes)
npm run dev
```

You should see:
```
[HH:MM:SS.sss] INFO: i-Tamil Recruit backend listening { "port": 4000, "env": "development" }
```

Then check the health endpoints:
```bash
curl http://localhost:4000/healthz   # liveness — process up
curl http://localhost:4000/readyz    # readiness — DB reachable
```

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev`       | Hot-reload dev server (tsx) |
| `npm run build`     | Compile TypeScript to `dist/` |
| `npm start`         | Run compiled server (production mode) |
| `npm run db:up`     | Start the local MySQL container |
| `npm run db:down`   | Stop it (data persists in a docker volume) |
| `npm run db:migrate` | Create + apply a new migration during development |
| `npm run db:deploy` | Apply pending migrations (used in production / Docker) |
| `npm run db:studio` | Open Prisma Studio at http://localhost:5555 — browse data visually |
| `npm run db:reset`  | **Destructive**: drop the DB and re-apply all migrations |

## Folder layout

```
backend/
├── prisma/
│   └── schema.prisma          # single source of truth for the data model
├── src/
│   ├── config/env.ts          # Zod-validated runtime config
│   ├── lib/
│   │   ├── logger.ts          # Pino — pretty in dev, JSON in prod
│   │   └── prisma.ts          # Prisma client singleton + graceful shutdown
│   ├── middleware/
│   │   ├── auth.ts            # requireAuth + requireRole(...)
│   │   ├── error.ts           # HttpError + central error → JSON handler
│   │   └── validate.ts        # Zod request validator
│   ├── routes/                # HTTP routes (one file per resource)
│   │   └── health.ts
│   ├── services/              # Business logic (called by routes/controllers)
│   ├── utils/jwt.ts           # access + refresh token sign/verify
│   └── index.ts               # Express app + server bootstrap
├── Dockerfile                 # multi-stage build for Render / AWS
├── docker-compose.yml         # local MySQL
└── render.yaml                # Render Blueprint for one-click deploy
```

## Auth model

* **Access token** — short-lived (15 min), set in `itr_access` httpOnly cookie. Carries `{ sub, role, email }`.
* **Refresh token** — long-lived (30 days), `itr_refresh` httpOnly cookie. Carries `{ sub, jti }` so we can revoke per session.
* **OTP** — 6-digit code stored as bcrypt hash with `expiresAt` (default 10 min) and `attempts` counter. In dev, codes are logged to stdout; in prod, swap `OTP_PROVIDER` for MSG91 / SES.

## Deploy

### Render (recommended for demo)
1. Push `backend/` to GitHub (already done).
2. On Render dashboard → **New → Blueprint** → select the repo → it reads [render.yaml](./render.yaml) and provisions both the web service and MySQL.
3. After first deploy, set `CORS_ORIGINS` to your real frontend URL (e.g. `https://itamil-recruit.vercel.app`).
4. Update the frontend's `VITE_API_URL` to point at the Render URL.

Note: Render's managed MySQL is paid. For the free tier we can either:
   * Use Render's free Postgres + switch the Prisma `provider` to `postgresql`, or
   * Use [PlanetScale](https://planetscale.com) for free MySQL.

### AWS (production)
EC2 / ECS for the API + RDS for MySQL. The Dockerfile is production-ready — point ECS / EKS at it.

## Phase 0 status

This is the **foundation only** — chassis, no business endpoints yet. The next phases add real routes:

* **Phase 1** — Auth & users (register, OTP, login, /me)
* **Phase 2** — Candidate profile CRUD + photo upload
* **Phase 3** — Jobs + applications
* **Phase 4** — Employer flow
* **Phase 5** — Subscriptions + Razorpay
* **Phase 6** — Admin module (moderation queue, audit log, KPIs)
* **Phase 7** — Super-Admin (editable pricing, sub-admin roles)
* **Phase 8** — Wire web + mobile frontends to the API
