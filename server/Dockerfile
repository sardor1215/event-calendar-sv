# server/Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# Install deps first for better caching
COPY package*.json ./
RUN npm ci --only=production

# App code
COPY src ./src

# Create persistent uploads dir and set permissions
RUN mkdir -p /usr/src/app/uploads && chown -R node:node /usr/src/app

USER node
ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]