FROM node:20-bookworm-slim AS frontend-builder

WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
RUN npm run build

FROM node:20-bookworm-slim AS backend-builder

WORKDIR /build/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM node:20-bookworm-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql postgresql-client gosu ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=frontend-builder /build/frontend /app/frontend
COPY --from=backend-builder /build/backend /app/backend
COPY start-space.sh /app/start-space.sh
RUN chmod +x /app/start-space.sh \
    && mkdir -p /app/backend/uploads \
    && chown -R postgres:postgres /app/backend/uploads

ENV NODE_ENV=production \
    WEB_PORT=7860 \
    BACKEND_PORT=3001 \
    DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/style_savant \
    NEXT_PUBLIC_API_URL=http://127.0.0.1:3001 \
    STORAGE_DRIVER=local \
    STORAGE_LOCAL_DIR=/app/backend/uploads \
    STORAGE_PUBLIC_BASE_URL= \
    PGDATA=/tmp/style-savant-postgres

EXPOSE 7860 10000
CMD ["/app/start-space.sh"]
