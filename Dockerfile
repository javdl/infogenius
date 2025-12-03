# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

# Build frontend (Vite) and server (TypeScript)
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and install production dependencies only
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

# Copy built frontend and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Railway provides PORT, default to 8080
ENV PORT=8080

# Run the Express server
CMD ["node", "dist-server/index.js"]
