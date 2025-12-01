# Use Node.js 20 Alpine as the base image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json first (if you have them)
COPY Program/package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code from Program directory
COPY Program/ .

# Expose port 80
EXPOSE 80

# Set environment variable for Node.js to use port 80
ENV PORT=80

# Start the Node.js app
CMD ["node", "index.js"]
