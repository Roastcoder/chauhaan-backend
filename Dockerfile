FROM node:20-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

# Create uploads directory and ensure correct permissions
RUN mkdir -p uploads && chmod 777 uploads

# Expose the API port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Use index.js as the main entry point
CMD ["node", "index.js"]
