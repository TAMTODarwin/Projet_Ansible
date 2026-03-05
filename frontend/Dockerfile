# Build Angular
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# Serve via Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Chemin adapté à Votre projet
COPY --from=build /app/dist/invoice-frontend/browser /usr/share/nginx/html
EXPOSE 80
