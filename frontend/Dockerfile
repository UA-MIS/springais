FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build for production
RUN npm run build

# Install serve globally
RUN npm install -g serve

# Expose port 8080
EXPOSE 8080

# Serve the built files
CMD ["serve", "-s", "dist", "-l", "8080"]