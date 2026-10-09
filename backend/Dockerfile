# syntax=docker/dockerfile:1

# ---------- base ----------
FROM node:22-alpine AS base
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache tini curl \
 && addgroup -g 1001 -S nodejs \
 && adduser  -u 1001 -S api -G nodejs

# ---------- deps ----------
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM base AS deps-dev
# base sets NODE_ENV=production, which would make npm skip devDependencies.
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci --include=dev --no-audit --no-fund

# ---------- dev ----------
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps-dev /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
RUN mkdir -p /app/uploads && chown -R api:nodejs /app
USER api
EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "run", "dev"]

# ---------- prod ----------
FROM base AS prod
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
RUN mkdir -p /app/uploads && chown -R api:nodejs /app
USER api
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]
