# Use official Playwright base image (Node.js + browsers preinstalled)
FROM mcr.microsoft.com/playwright:v1.55.0

# Create app directory
WORKDIR /backend

# Copy package files
COPY package*.json tsconfig.json ./

# Install dependencies
RUN corepack enable && pnpm install

# Copy backend source
COPY src/ /backend/src/
# Build the application
RUN pnpm run build

# Create directories for volumes
RUN mkdir -p /backend/reports /backend/browser-data

# Install Xvfb for virtual display
RUN apt-get update && \
    apt-get install -y --no-install-recommends xvfb && \
    rm -rf /var/lib/apt/lists/*

# Environment for headed mode
ENV DISPLAY=:99

# Copy entrypoint
COPY docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Use entrypoint to bootstrap Xvfb then run your backend
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["pnpm", "start"]
