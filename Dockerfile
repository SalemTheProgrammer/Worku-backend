# ========================
# ⛏ Build Stage
# ========================
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Build NestJS app
RUN npm run build

# ========================
# 🚀 Production Stage
# ========================
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy only package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built app from builder
COPY --from=builder /usr/src/app/dist ./dist

# Optional: Copy env file for production
COPY --from=builder /usr/src/app/.env.production ./.env.production

# Create required directories with proper permissions
RUN mkdir -p uploads logs && \
    chown -R node:node /usr/src/app && \
    chown -R node:node uploads logs

# Run as non-root user
USER node

# Create volume mount points
VOLUME ["/usr/src/app/uploads", "/usr/src/app/logs"]

# Expose port used by NestJS (adjust if needed)
EXPOSE 8080

# Set env mode
ENV NODE_ENV=production

# Start the app
CMD ["node", "dist/main"]
