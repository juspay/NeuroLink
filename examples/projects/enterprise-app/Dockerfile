FROM node:20-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S neurolink -u 1001 -G nodejs

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

# Change ownership and switch to non-root user
RUN chown -R neurolink:nodejs /app
USER neurolink

CMD ["node", "dist/index.js"]
