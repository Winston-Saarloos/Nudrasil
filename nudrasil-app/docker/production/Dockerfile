FROM node:22-alpine AS base

# Allow Corepack to download the right Yarn if needed
ENV COREPACK_ENABLE_DOWNLOADS=1

# ---------- deps ----------
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy only what's needed to resolve Yarn + install deps
COPY package.json yarn.lock* .yarnrc.yml ./

# Enable Corepack and install the package manager specified by package.json
RUN corepack enable && corepack install

COPY .yarn .yarn/

# Install dependencies with the pinned Yarn
RUN yarn install --immutable

# ---------- builder ----------
FROM base AS builder
WORKDIR /app

COPY package.json .yarnrc.yml ./
RUN corepack enable && corepack install

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN yarn build

# ---------- runner ----------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# prerender cache dir
RUN mkdir .next && chown nextjs:nodejs .next

# standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
