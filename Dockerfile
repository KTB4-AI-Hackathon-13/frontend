# --- build stage: Vite 빌드 ---
FROM node:24.19.0-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- run stage: Caddy로 정적 서빙 + 자동 HTTPS ---
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /usr/share/caddy
