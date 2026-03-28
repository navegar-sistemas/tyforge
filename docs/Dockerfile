# Stage 1: Build
FROM node:24.14.1-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund --loglevel error

COPY . .
RUN npm run build && node generate-csp.js && rm -rf node_modules

# Verify: script-src no longer contains unsafe-inline (style-src may still have it)
RUN ! grep -q "script-src[^;]*unsafe-inline" /app/nginx.conf \
    || (echo "ERROR: generate-csp.js failed to replace unsafe-inline in script-src" && exit 1)

# Stage 2: Serve (Nginx Alpine)
FROM nginx:1.28.3-alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

# Smoke test: verify nginx config is valid and site index exists
RUN nginx -t && test -f /usr/share/nginx/html/index.html

EXPOSE 4200

USER nginx

CMD ["nginx", "-g", "daemon off;"]
