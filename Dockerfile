# Multi-stage production build for Next.js standalone

# 1. Dependencies Stage
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
# Install dependencies cleanly
RUN npm ci

# 2. Builder Stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment setup for build (Telemetry disabled)
ENV NEXT_TELEMETRY_DISABLED 1

# Generate Prisma Client (if needed for build step typechecks)
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# 3. Runner Stage (Production)
FROM node:22-alpine AS runner
WORKDIR /app

# Production environment
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    apk add --no-cache curl openssl

# Copy public directory for static assets
COPY --from=builder /app/public ./public

# Set proper permissions for .next directory
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output and static files
# The standalone output includes minimal node_modules required for production
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Healthcheck to verify the server is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the standalone server
CMD ["node", "server.js"]
