# Lealtix

Aplicación orientada a pequeños negocios (restaurantes, tiendas y boutiques) que permite gestionar clientes, inventarios y ventas, así como generar campañas de promociones personalizadas basadas en el historial de consumo.

---

## 🚀 Especificaciones Técnicas

- **Lenguaje principal:** Java (Backend)
- **Framework Frontend:** Angular (Landing Page / Dashboard)
- **Base de Datos:** (Pendiente: MySQL / PostgreSQL / MongoDB)
- **Versionamiento:** Git + GitHub
- **Gestión de dependencias:**
  - Backend → Maven/Gradle
  - Frontend → npm

---

## 📦 Requisitos Previos

Antes de instalar y correr el proyecto asegúrate de tener:

- [Node.js](https://nodejs.org/) `>= 18.x`
- [npm](https://www.npmjs.com/) `>= 9.x`
- [Angular CLI](https://angular.io/cli) `>= 17.x`
- [Java JDK](https://adoptium.net/) `>= 17`
- [Git](https://git-scm.com/)
- Base de datos configurada (pendiente definir)

---

## 🔧 Instalación y Configuración

Clona el repositorio:

```bash
git clone https://github.com/KikeGitHub/lealtix-main.git
cd lealtix-main
```

---

## 🔗 Configuración de Endpoints del Backend (Java Spring Boot)

Las URLs del Backend (`apiUrl`) están centralizadas en los archivos de entorno de Angular (`src/environments/`):

- **Producción (Usado por Docker por defecto):**
  - **Archivo:** [`src/environments/environment.prod.ts`](file:///c:/Users/kike2/OneDrive/Escritorio/Lealtix/workspace/FE/lealtix-main/src/environments/environment.prod.ts)
  - **Línea a modificar:** `apiUrl: 'https://tu-servidor-o-ip:8080/api'`

- **Desarrollo:**
  - **Archivo:** [`src/environments/environment.dev.ts`](file:///c:/Users/kike2/OneDrive/Escritorio/Lealtix/workspace/FE/lealtix-main/src/environments/environment.dev.ts)
  - **Línea a modificar:** `apiUrl: 'https://lealtix-service.onrender.com/api'`

- **Local:**
  - **Archivo:** [`src/environments/environment.local.ts`](file:///c:/Users/kike2/OneDrive/Escritorio/Lealtix/workspace/FE/lealtix-main/src/environments/environment.local.ts)
  - **Línea a modificar:** `apiUrl: 'http://localhost:8080/api'`

---

## 🐳 Despliegue con Docker (Servidor Físico)

El proyecto incluye una configuración multi-etapa con **Nginx** optimizada para producción.

### 1. Configurar la URL de tu Backend
Antes de compilar la imagen Docker, edita la IP o dominio de tu servidor Backend Java Spring Boot en [`src/environments/environment.prod.ts`](file:///c:/Users/kike2/OneDrive/Escritorio/Lealtix/workspace/FE/lealtix-main/src/environments/environment.prod.ts).

### 2. Construir y Desplegar

#### Usando Docker Compose (Recomendado):
```bash
docker compose up -d --build
```

#### Usando Comandos Docker Tradicionales:
```bash
# Construir la imagen de producción
docker build -t lealtix-frontend .

# Ejecutar el contenedor en el puerto 80
docker run -d -p 80:80 --name lealtix-frontend lealtix-frontend
```

---

## 📄 Estructura de Archivos Docker

- `Dockerfile`: Multi-stage build (Node.js 20 para compilar `dist/lealtix_main/browser` + Nginx Alpine para servir).
- `nginx.conf`: Configuración del servidor Nginx con soporte para Angular SPA Routing (evita error 404 al recargar) y compresión Gzip.
- `.dockerignore`: Excluye carpetas como `node_modules` y `.git` para un build rápido.
- `docker-compose.yml`: Orquestación simplificada del contenedor.
