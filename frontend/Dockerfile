# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json tsconfig.node.json vite.config.ts index.html ./
COPY src/ ./src/
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY server.js ./
COPY --from=builder /app/dist ./dist

EXPOSE 5000

USER node

CMD ["node", "server.js"]
