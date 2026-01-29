# Stage 1: Build the React application
FROM node:20-alpine as builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (ci for exact version match)
RUN npm ci

# Copy source code
COPY . .

# Build arguments
ARG VITE_PUBNUB_PUBLISH_KEY
ARG VITE_PUBNUB_SUBSCRIBE_KEY

# Set env vars for build time
ENV VITE_PUBNUB_PUBLISH_KEY=$VITE_PUBNUB_PUBLISH_KEY
ENV VITE_PUBNUB_SUBSCRIBE_KEY=$VITE_PUBNUB_SUBSCRIBE_KEY

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine as runner

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
