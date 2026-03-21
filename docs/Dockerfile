# Stage 1: Build
FROM node:24.14.0-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund --loglevel error

COPY . .
RUN npm run build

# Stage 2: Serve (Nginx Alpine)
FROM nginx:stable-alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]
