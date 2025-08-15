# Simplified Multi-stage Dockerfile for Node.js/Fastify Backend
# Clean architecture with explicit service stages

# =============================================================================
# Base Stage - Common setup for all services
# =============================================================================
FROM oven/bun:alpine AS base

# Install essential packages
RUN apk --no-cache add dumb-init ca-certificates

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY prisma/schema.prisma ./prisma/

# Install dependencies and generate Prisma client
RUN bun install \
    && bun prisma generate

# Copy source code
COPY . .

# =============================================================================
# Development Stages - For local development with hot reload
# =============================================================================
FROM base AS rest-api-dev
EXPOSE 8080
CMD ["dumb-init", "bun", "run", "dev:rest-api"]

FROM base AS event-queue-dev
CMD ["dumb-init", "bun", "run", "dev:event-queue"]

# =============================================================================
# Production Stages - Optimized for production deployment
# =============================================================================
FROM oven/bun:alpine AS rest-api-prod

# Install essential packages and create non-root user
RUN apk --no-cache add dumb-init ca-certificates \
    && addgroup -g 1001 -S bunjs \
    && adduser -S backend -u 1001 -G bunjs

# Set production environment
ENV NODE_ENV=production
WORKDIR /app

# Copy built application from base stage
COPY --from=base --chown=backend:bunjs /app ./

# Build the application and remove dev dependencies
RUN bun run build \
    && bun install --production

# Switch to non-root user
USER backend

# Expose port and add health check
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD bun -e "const res = await fetch('http://localhost:8080/'); process.exit(res.ok ? 0 : 1)"

# Start the REST API service
CMD ["dumb-init", "bun", "run", "start:rest-api"]

# =============================================================================
FROM oven/bun:alpine AS event-queue-prod

# Install essential packages and create non-root user
RUN apk --no-cache add dumb-init ca-certificates \
    && addgroup -g 1001 -S bunjs \
    && adduser -S backend -u 1001 -G bunjs

# Set production environment
ENV NODE_ENV=production
WORKDIR /app

# Copy built application from base stage
COPY --from=base --chown=backend:bunjs /app ./

# Build the application and remove dev dependencies
RUN bun run build \
    && bun install --production

# Switch to non-root user
USER backend

# Start the event queue service
CMD ["dumb-init", "bun", "run", "start:event-queue"]