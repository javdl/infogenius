# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Build the application
# Note: If you have environment variables that need to be baked in at build time,
# you might need to pass them as build args (ARG) here.
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install serve to run the static application
RUN npm install -g serve

# Copy the build output from the builder stage
COPY --from=builder /app/dist ./dist

# Cloud Run provides the PORT environment variable
ENV PORT=8080

# Serve the app on the specified port
CMD ["sh", "-c", "serve -s dist -l $PORT"]
