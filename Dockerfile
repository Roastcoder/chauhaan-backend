FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

# Create uploads directory and ensure correct permissions
RUN mkdir -p uploads && chmod 777 uploads

# Expose the API port
EXPOSE 4000

# Set environment to production
ENV NODE_ENV=production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/ || exit 1

# Use index.js as the main entry point
CMD ["node", "index.js"]
