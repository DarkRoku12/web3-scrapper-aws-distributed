FROM node:23-slim

# Install pnpm globally
RUN npm install -g pnpm

# Install miscellaneous dependencies.
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=true

# Copy source code
COPY *.ts ./

# Set environment variables
ENV PORT=7010
ENV NODE_ENV=production

# Expose port
EXPOSE 7010

# Create healthcheck endpoint for ECS health checks
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:7010/health || exit 1

# Start the application
CMD ["pnpm", "start"]