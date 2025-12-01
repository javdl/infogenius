# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Accept API key as build argument and set as environment variable for build
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

# Verify API key is set before building
RUN if [ -z "$GEMINI_API_KEY" ]; then \
      echo "ERROR: GEMINI_API_KEY build argument is required"; \
      exit 1; \
    fi
RUN echo "Building with API key configured"

# Build the application (Vite will bake the API key into the bundle)
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
