# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# ---------- dev (vite + HMR) ----------
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ---------- build ----------
FROM base AS build
ARG VITE_API_URL=/api/v1
ARG VITE_SITE_URL=http://localhost:8080
ARG VITE_SITE_NAME=Vishal
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SITE_URL=$VITE_SITE_URL \
    VITE_SITE_NAME=$VITE_SITE_NAME \
    NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- prod (nginx) ----------
FROM nginx:1.27-alpine AS prod
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY security-headers.conf /etc/nginx/security-headers.conf
ENV API_UPSTREAM=http://backend:4000
EXPOSE 80
