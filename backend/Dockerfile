# Multi-stage build — tiny runtime image with only prod deps + compiled JS.
FROM node:22-alpine AS builder
WORKDIR /app

# Install deps separately to maximise layer cache.
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

# --------- runtime ---------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only the bits the runtime needs — no source, no dev deps.
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

COPY --from=builder /app/dist ./dist

# Render injects $PORT; default to 4000 for local docker runs.
ENV PORT=4000
EXPOSE 4000

# Apply pending migrations on boot, then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
