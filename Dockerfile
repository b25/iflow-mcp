# Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

ENV NODE_ENV=production
ENV IFLOW_MCP_TRANSPORT=http
ENV IFLOW_HTTP_BIND_HOST=0.0.0.0
EXPOSE 3000
# Distroless node image runs as non-root by default
CMD ["dist/index.js"]
