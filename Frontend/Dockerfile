# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

# Explicitly copy public and src folders
COPY public/ ./public/
COPY src/ ./src/
# Copy config files
COPY nginx.conf ./
# Copy whatever else is left (like .env if needed, though strictly we mapped it)
# COPY . . 

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Disable CI to prevent treating warnings as errors
ENV CI=false
RUN npm run build


# Production stage
FROM nginx:alpine

# Copiar archivos de build
COPY --from=build /app/build /usr/share/nginx/html

# Configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]