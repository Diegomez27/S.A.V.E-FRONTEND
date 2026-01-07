



# S.A.V.E. 2.0 - Sistema de Acceso y Verificación Electrónica
Un sistema inteligente de gestión de acceso que combina hardware RFID/NFC con una aplicación móvil para control de puertas y registro de accesos.

## Descripción del Proyecto

S.A.V.E. 2.0 es un sistema completo de control de acceso que permite:
- **Autenticación segura** con JWT
- **Gestión de tarjetas RFID/NFC** desde app móvil
- **Control de acceso remoto** desde teléfono
- **Historial completo** de todos los accesos
- **Hardware integrado** con ESP32 y lector RFID
- **Base de datos PostgreSQL** para persistencia

## Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ESP32 + RFID  │    │   Backend API   │    │   App Móvil     │
│   (Hardware)    │◄──►│   NestJS + PG   │◄──►│   Ionic + NFC   │
│                 │    │                 │    │                 │
│ • Lee tarjetas  │    │ • Valida acceso │    │ • Gestiona      │
│ • Controla relé │    │ • Gestiona BD   │    │   tarjetas      │
│ • Envía datos   │    │ • JWT Auth      │    │ • Historial     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Componentes:
- **Hardware (ESP32):** Lector RFID RC522 + módulo relé para control de cerradura
- **Backend (NestJS):** API REST con autenticación JWT y base de datos PostgreSQL
- **Frontend (Ionic):** App móvil con NFC para gestión de tarjetas

## Tecnologías Utilizadas

### Backend:
- **Framework:** NestJS
- **Lenguaje:** TypeScript
- **Base de datos:** PostgreSQL (Docker)
- **ORM:** TypeORM
- **Autenticación:** JWT + Passport
- **Validación:** class-validator
- **Hashing:** bcrypt

### Infraestructura:
- **Contenedor:** Docker + Docker Compose
- **Base de datos:** PostgreSQL 15 Alpine
- **Puerto:** 3001 (configurable)

## API Endpoints

### Autenticación (`/auth`)
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `POST` | `/auth/login` | Iniciar sesión con usuario/contraseña | Público |
| `POST` | `/auth/register` | Registrar nuevo usuario (solo admin) | JWT requerido |

### Gestión de Tarjetas (`/cards`)
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/cards` | Obtener todas las tarjetas registradas | JWT requerido |
| `POST` | `/cards` | Registrar nueva tarjeta RFID/NFC | JWT requerido |
| `DELETE` | `/cards/:id` | Eliminar tarjeta por ID | JWT requerido |

### Control de Acceso (`/access`)
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `POST` | `/access/validate` | Validar acceso RFID (para ESP32) | Público |
| `GET` | `/access/history` | Obtener historial de accesos | JWT requerido |
| `POST` | `/access/open` | Abrir puerta remotamente | JWT requerido |

## 🚀 Instalación y Configuración

### Prerrequisitos:
- Node.js (v18+)
- Docker y Docker Compose
- Git

### 1. Clonar el repositorio:
```bash
git clone https://github.com/Diegomez27/S.A.V.E-BACKEND.git
cd save-backend-v2
```

### 2. Instalar dependencias:
```bash
npm install
```

### 3. Configurar base de datos:
```bash
# Iniciar PostgreSQL con Docker
docker-compose up -d
```

### 4. Ejecutar la aplicación:
```bash
# Modo desarrollo (con hot reload)
npm run start:dev

# La aplicación estará disponible en: http://localhost:3001
```

### 5. Verificar instalación:
```bash
# Probar endpoint básico
curl http://localhost:3001/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Usuario por Defecto

Al iniciar la aplicación por primera vez, se crea automáticamente un usuario administrador:

- **Username:** `admin`
- **Password:** `admin123`

## Base de Datos

### Entidades principales:

#### `User` - Usuarios del sistema
```typescript
{
  id: number;
  username: string;     // Único
  password_hash: string;
}
```

#### `Card` - Tarjetas RFID/NFC registradas
```typescript
{
  id: number;
  uid: string;          // UID único de la tarjeta
  name: string;         // Nombre descriptivo
  isEnabled: boolean;   // Estado de la tarjeta
  createdAt: Date;
}
```

#### `AccessLog` - Historial de accesos
```typescript
{
  id: number;
  cardUid: string;      // UID de la tarjeta
  cardName: string;     // Nombre de la tarjeta
  wasAuthorized: boolean; // Si se permitió el acceso
  type: 'RFID' | 'REMOTE'; // Tipo de acceso
  timestamp: Date;
}
```

## Uso Básico

### 1. Autenticación:
```bash
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Respuesta: { "access_token": "eyJhbGciOiJIUzI1NiIs..." }
```

### 2. Gestionar tarjetas:
```bash
# Obtener token del login anterior
TOKEN="tu_token_jwt_aqui"

# Listar tarjetas
curl -X GET http://localhost:3001/cards \
  -H "Authorization: Bearer $TOKEN"

# Crear tarjeta
curl -X POST http://localhost:3001/cards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uid":"A1B2C3D4","name":"Tarjeta Principal"}'
```

### 3. Control de acceso:
```bash
# Validar acceso (simula ESP32)
curl -X POST http://localhost:3001/access/validate \
  -H "Content-Type: application/json" \
  -d '{"uid":"A1B2C3D4"}'

# Ver historial
curl -X GET http://localhost:3001/access/history \
  -H "Authorization: Bearer $TOKEN"

# Abrir remotamente
curl -X POST http://localhost:3001/access/open \
  -H "Authorization: Bearer $TOKEN"
```

## Configuración Avanzada

### Variables de Entorno:
```bash
# Crear archivo .env
PORT=3001
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=postgres
DB_PASSWORD
DB_DATABASE=SaveDB
JWT_SECRET=tu_clave_secreta_jwt
```

### Configuración de Producción:
```bash
# Build para producción
npm run build

# Ejecutar en producción
npm run start:prod
```

**Proyecto S.A.V.E. 2.0**
- **Autor:** Diego Gómez
- **GitHub:** [Diegomez27](https://github.com/Diegomez27)
- **Fecha:** Octubre 2025

---

*Sistema desarrollado como proyecto académico para demostrar integración de IoT, backend y frontend en un sistema de control de acceso inteligente.*
