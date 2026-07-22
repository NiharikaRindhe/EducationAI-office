# ─── Stage 1: builder ────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies first (layer-cached unless package.json changes)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and compile TypeScript → dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Prune dev-dependencies so we only ship production deps
RUN npm prune --production

# ─── Stage 2: runtime ────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

# Non-root user for security
RUN addgroup -S eduai && adduser -S -G eduai eduai

COPY --from=builder --chown=eduai:eduai /app/dist ./dist
COPY --from=builder --chown=eduai:eduai /app/node_modules ./node_modules
COPY --from=builder --chown=eduai:eduai /app/package.json ./

USER eduai

# The Node API listens on this port (matches env.port / PORT env var)
EXPOSE 3001

# Healthcheck so Docker Compose / Nginx knows when the API is ready
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/health | grep -q '"status":"ok"' || exit 1

CMD ["node", "dist/index.js"]
