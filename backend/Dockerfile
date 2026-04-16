FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build all 4 apps into one image
RUN rm -rf dist && npm run build:all

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV APP_NAME=api

RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nestjs /app/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/package.json ./
COPY --from=builder --chown=nestjs:nestjs /app/salomat-knowledge ./salomat-knowledge
COPY --from=builder --chown=nestjs:nestjs /app/docker-entrypoint.sh ./

USER nestjs
EXPOSE 3000

# APP_NAME env var selects which app to run (api, clinic, voice-agent, payments)
CMD ["sh", "docker-entrypoint.sh"]
