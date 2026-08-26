# ==========================================
# Etapa 1: Construcción (Build) de Angular
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm ci || npm install

# Copiar el resto del código del proyecto
COPY . .

# Compilar la aplicación para producción
RUN npm run build -- --configuration=production

# ==========================================
# Etapa 2: Servidor Web Nginx para Producción
# ==========================================
FROM nginx:alpine

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados de Angular al directorio de Nginx
COPY --from=build /app/dist/lealtix_main/browser /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
