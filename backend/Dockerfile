# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine

WORKDIR /app

# Non-root user for security
USER node

COPY --from=builder --chown=node:node /app/package.json /app/package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder --chown=node:node /app/dist/ ./dist/

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
