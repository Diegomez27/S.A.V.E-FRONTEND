# --- Etapa 1: Construcción (Build) ---
FROM node:22-alpine as build
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# aplicación para producción
# esto generará la carpeta "www"
RUN npm run build -- --configuration=production

# --- Etapa 2: Servidor (Production) ---
FROM nginx:alpine

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados desde la etapa de construcción
COPY --from=build /app/www /usr/share/nginx/html

# puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
