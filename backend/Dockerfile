# Stage 1: Build NestJS Application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/products.json ./dist/database/products.json
COPY --from=builder /app/src/database/products.json ./src/database/products.json

# Create data directory for persistent disk storage
RUN mkdir -p /app/data

EXPOSE 5000

CMD ["node", "dist/main.js"]
