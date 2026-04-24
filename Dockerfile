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
  CMD wget -q -O /dev/null http://localhost:4000/ || exit 1

# Use index.js as the main entry point
CMD ["node", "index.js"]
