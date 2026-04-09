FROM node:24-bookworm-slim AS builder

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY shared/schema-sync-core/package.json ./shared/schema-sync-core/package.json
COPY backend/package.json ./backend/package.json
COPY services/schema-sync-service/package.json ./services/schema-sync-service/package.json

RUN npm ci

COPY . .

RUN npm run build -w @schemadash/schema-sync-core && \
    npm run build -w @schemadash/backend && \
    npm prune --omit=dev

FROM node:24-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV SCHEMADASH_DATA_DIR=/app/data

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/backend/dist ./dist
COPY --from=builder /usr/src/app/backend/package.json ./package.json
COPY --from=builder /usr/src/app/shared/schema-sync-core/dist ./node_modules/@schemadash/schema-sync-core/dist
COPY --from=builder /usr/src/app/shared/schema-sync-core/package.json ./node_modules/@schemadash/schema-sync-core/package.json

RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 4010

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:4010/api/livez').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
