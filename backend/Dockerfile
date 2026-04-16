FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build target app (default: api)
ARG APP_NAME=api
RUN npm run build:${APP_NAME}

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nestjs /app/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/package.json ./

# Copy salomat knowledge base (needed by voice-agent and api)
COPY --from=builder --chown=nestjs:nestjs /app/salomat-knowledge ./salomat-knowledge

USER nestjs

ARG APP_NAME=api
ENV APP_NAME=${APP_NAME}
EXPOSE 3000

# Dynamic CMD based on APP_NAME
CMD node dist/apps/${APP_NAME}/main.js
