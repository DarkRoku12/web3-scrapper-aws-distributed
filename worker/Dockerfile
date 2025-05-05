FROM node:23-slim

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
RUN pnpm install --frozen-lockfile --prod=true

# Copy only TypeScript files
COPY *.ts ./

# Set environment variables if needed
ENV TARGET_URL=https://api.example.com/data

# Create volume for AWS credentials
VOLUME /root/.aws

# Expose port if your app needs it
EXPOSE 7020

# Default command to run the worker
CMD ["pnpm", "start"]