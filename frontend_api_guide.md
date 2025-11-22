# 📘 **GUÍA TÉCNICA COMPLETA PARA FRONTEND - S.A.V.E. Backend API**

---

## 🌐 **BASE URL**
```
http://localhost:3001
```
**En Raspberry Pi:** `http://<IP_DE_LA_PI>:3001`

---

## 🔐 **1. AUTENTICACIÓN**

### **Login**
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Respuesta exitosa (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores:**
- `401 Unauthorized` - Credenciales inválidas
- `429 Too Many Requests` - Demasiados intentos (5 máx cada 15 min)

**⚠️ IMPORTANTE:** Guarda el token en `localStorage` o `Ionic Storage`

---

### **Registro (Solo Admin)**
```http
POST /auth/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "nuevo_usuario",
  "password": "password123"
}
```

**Respuesta (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 2,
    "username": "nuevo_usuario"
  }
}
```

---

## 🎫 **2. GESTIÓN DE TARJETAS**

### **Obtener todas las tarjetas activas**
```http
GET /cards
Authorization: Bearer <token>
```

**Respuesta (200):**
```json
[
  {
    "id": 1,
    "uid": "A1B2C3D4",
    "name": "Tarjeta Principal",
    "isEnabled": true,
    "createdAt": "2025-11-10T12:00:00.000Z",
    "deletedAt": null
  },
  {
    "id": 2,
    "uid": "5E6F7G8H",
    "name": "Tarjeta Secundaria",
    "isEnabled": true,
    "createdAt": "2025-11-09T15:30:00.000Z",
    "deletedAt": null
  }
]
```

---

### **Ver tarjetas eliminadas (Papelera)**
```http
GET /cards/deleted
Authorization: Bearer <token>
```

**Respuesta (200):**
```json
[
  {
    "id": 3,
    "uid": "9I0J1K2L",
    "name": "Tarjeta Vieja",
    "isEnabled": false,
    "createdAt": "2025-10-15T10:00:00.000Z",
    "deletedAt": "2025-11-05T14:20:00.000Z"
  }
]
```

---

### **Crear nueva tarjeta (con NFC del teléfono)**
```http
POST /cards
Authorization: Bearer <token>
Content-Type: application/json

{
  "uid": "A1B2C3D4",
  "name": "Mi Tarjeta Nueva"
}
```

**⚠️ VALIDACIONES DEL UID:**
- Solo caracteres hexadecimales (0-9, A-F)
- Mínimo 4, máximo 20 caracteres
- Se convierte automáticamente a MAYÚSCULAS
- Espacios se eliminan automáticamente

**Respuesta (201):**
```json
{
  "id": 4,
  "uid": "A1B2C3D4",
  "name": "Mi Tarjeta Nueva",
  "isEnabled": true,
  "createdAt": "2025-11-10T16:45:00.000Z",
  "deletedAt": null
}
```

**Errores:**
- `409 Conflict` - UID ya existe (tarjeta duplicada)
- `400 Bad Request` - UID inválido (no hexadecimal)

**💡 NOTA:** Si el UID existía pero estaba eliminado, **se restaura automáticamente**

---

### **Eliminar tarjeta (Soft Delete)**
```http
DELETE /cards/:id
Authorization: Bearer <token>
```

**Ejemplo:** `DELETE /cards/1`

**Respuesta (200):**
```json
{
  "message": "Card deleted successfully"
}
```

**⚠️ IMPORTANTE:** La tarjeta NO se elimina permanentemente, solo se marca como eliminada. Aparecerá en `/cards/deleted`

---

### **Restaurar tarjeta de la papelera**
```http
PATCH /cards/:id/restore
Authorization: Bearer <token>
```

**Ejemplo:** `PATCH /cards/3/restore`

**Respuesta (200):**
```json
{
  "message": "Card restored successfully",
  "card": {
    "id": 3,
    "uid": "9I0J1K2L",
    "name": "Tarjeta Vieja",
    "isEnabled": true,
    "createdAt": "2025-10-15T10:00:00.000Z",
    "deletedAt": null
  }
}
```

---

### **Eliminar tarjeta permanentemente**
```http
DELETE /cards/:id/permanent
Authorization: Bearer <token>
```

**Ejemplo:** `DELETE /cards/3/permanent`

**⚠️ CUIDADO:** Esta acción es **IRREVERSIBLE**

**Respuesta (200):**
```json
{
  "message": "Card permanently deleted"
}
```

---

## 🚪 **3. CONTROL DE ACCESO**

### **Ver historial de accesos (CON FILTROS)**
```http
GET /access/history?startDate=<fecha>&endDate=<fecha>&type=<tipo>&search=<texto>&page=<num>&limit=<num>
Authorization: Bearer <token>
```

**Parámetros (TODOS OPCIONALES):**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `startDate` | string (ISO 8601) | Fecha inicio | `2025-12-01T00:00:00Z` |
| `endDate` | string (ISO 8601) | Fecha fin | `2025-12-31T23:59:59Z` |
| `type` | string | Tipo de acceso | `RFID` o `REMOTE` |
| `search` | string | Buscar en nombre | `tarjeta` |
| `page` | number | Página (min: 1) | `1` |
| `limit` | number | Items por página (max: 100) | `20` |

**Ejemplos de URLs:**
```
# Sin filtros (últimos 50)
GET /access/history

# Con paginación
GET /access/history?page=1&limit=20

# Mes de diciembre
GET /access/history?startDate=2025-12-01T00:00:00Z&endDate=2025-12-31T23:59:59Z

# Solo RFID de diciembre
GET /access/history?startDate=2025-12-01T00:00:00Z&endDate=2025-12-31T23:59:59Z&type=RFID

# Buscar por nombre
GET /access/history?search=juan

# Todo combinado
GET /access/history?startDate=2025-12-01T00:00:00Z&type=RFID&search=principal&page=1&limit=10
```

**Respuesta (200):**
```json
{
  "data": [
    {
      "id": 125,
      "cardUid": "A1B2C3D4",
      "cardName": "Tarjeta Principal",
      "wasAuthorized": true,
      "type": "RFID",
      "timestamp": "2025-11-10T14:30:25.000Z"
    },
    {
      "id": 124,
      "cardUid": "REMOTE",
      "cardName": "Remote Access",
      "wasAuthorized": true,
      "type": "REMOTE",
      "timestamp": "2025-11-10T12:15:00.000Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

**Campos importantes:**
- `wasAuthorized: true` - Acceso permitido (verde)
- `wasAuthorized: false` - Acceso denegado (rojo)
- `type: "RFID"` - Tarjeta física
- `type: "REMOTE"` - Apertura desde app
- `hasNextPage` / `hasPrevPage` - Para navegación

---

### **Abrir puerta remotamente**
```http
POST /access/open
Authorization: Bearer <token>
```

**Respuesta (200):**
```json
{
  "message": "Remote access granted"
}
```

**💡 NOTA:** Este endpoint también crea un registro en el historial con tipo `REMOTE`

---

## 🔑 **4. AUTENTICACIÓN EN TODAS LAS PETICIONES**

### **Interceptor HTTP (Angular/Ionic)**

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('access_token');
    
    if (token) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(cloned);
    }
    
    return next.handle(req);
  }
}
```

---

## ⚠️ **5. MANEJO DE ERRORES**

### **Códigos de estado HTTP:**

| Código | Significado | Acción en Frontend |
|--------|-------------|-------------------|
| `200` | OK | Mostrar datos |
| `201` | Creado | Confirmar creación |
| `400` | Bad Request | Mostrar error de validación |
| `401` | No autorizado | Redirect a login |
| `403` | Prohibido | No tiene permisos (no es admin) |
| `404` | No encontrado | Recurso no existe |
| `409` | Conflicto | UID duplicado o recurso ya existe |
| `429` | Demasiadas peticiones | Esperar y reintentar |
| `500` | Error del servidor | Mostrar error genérico |

### **Formato de errores:**
```json
{
  "statusCode": 400,
  "message": ["UID must contain only hexadecimal characters (0-9, A-F)"],
  "error": "Bad Request"
}
```

**Ejemplo de manejo:**
```typescript
try {
  const response = await this.http.post('/cards', cardData).toPromise();
  // Éxito
} catch (error) {
  if (error.status === 401) {
    // Token expirado, redirect a login
    this.router.navigate(['/login']);
  } else if (error.status === 409) {
    // UID duplicado
    this.showAlert('Esta tarjeta ya existe');
  } else if (error.status === 429) {
    // Rate limit
    this.showAlert('Demasiados intentos, espera un momento');
  } else {
    this.showAlert(error.error.message || 'Error desconocido');
  }
}
```

---

## 📱 **6. INTEGRACIÓN CON NFC (Capacitor)**

### **Leer tarjeta NFC en el teléfono:**

```typescript
import { NFC } from '@awesome-cordova-plugins/nfc/ngx';

async scanNFCCard() {
  try {
    const tag = await this.nfc.addNdefListener(() => {
      console.log('Listening for NFC tags...');
    }).subscribe((tag) => {
      // Obtener el UID de la tarjeta
      const uid = this.nfc.bytesToHexString(tag.id).toUpperCase();
      
      // Crear la tarjeta en el backend
      this.createCard(uid);
    });
  } catch (error) {
    console.error('NFC Error:', error);
  }
}

createCard(uid: string) {
  const cardData = {
    uid: uid,
    name: 'Nueva Tarjeta'  // Pedir al usuario
  };
  
  this.http.post('http://localhost:3001/cards', cardData).subscribe(
    response => console.log('Tarjeta creada:', response),
    error => console.error('Error:', error)
  );
}
```

---

## 🔄 **7. FLUJO COMPLETO DE LA APP**

### **1. Login Flow:**
```
1. Usuario ingresa credenciales
2. POST /auth/login
3. Guardar token en localStorage
4. Navegar a dashboard
```

### **2. Ver Tarjetas:**
```
1. GET /cards (con token)
2. Mostrar lista de tarjetas
3. Opción de eliminar cada una
```

### **3. Agregar Tarjeta con NFC:**
```
1. Botón "Agregar Tarjeta"
2. Activar lector NFC del teléfono
3. Acercar tarjeta al teléfono
4. Leer UID (hexadecimal)
5. Pedir nombre de la tarjeta
6. POST /cards { uid, name }
7. Actualizar lista
```

### **4. Ver Historial:**
```
1. GET /access/history?page=1&limit=20
2. Mostrar lista con:
   - Nombre de tarjeta
   - Fecha/hora
   - Autorizado (✓) o Denegado (✗)
   - Tipo (RFID 🏷️ o Remote 📱)
3. Botones de paginación (prev/next)
4. Filtros opcionales
```

### **5. Abrir Puerta Remotamente:**
```
1. Botón "Abrir Puerta"
2. POST /access/open (con token)
3. Mostrar confirmación
4. Se crea registro en historial
```

---

## 🛡️ **8. SEGURIDAD - PUNTOS CLAVE**

### **Rate Limiting:**
- **Login:** Máximo 5 intentos cada 15 minutos
- **Otros endpoints:** 10 peticiones por minuto
- **Respuesta:** `429 Too Many Requests`

### **Token JWT:**
- **Duración:** 24 horas
- **Almacenar en:** `localStorage` o `Ionic Storage`
- **Incluir en:** Header `Authorization: Bearer <token>`
- **Renovar cuando:** Error `401 Unauthorized`

### **Validaciones del Frontend:**
```typescript
// UID solo hexadecimal
const isValidUID = /^[A-Fa-f0-9]{4,20}$/.test(uid);

// Username (3-50 caracteres, alfanumérico)
const isValidUsername = /^[a-zA-Z0-9_-]{3,50}$/.test(username);

// Password (mínimo 6 caracteres)
const isValidPassword = password.length >= 6;
```

---

## 🎨 **9. SUGERENCIAS DE UI/UX**

### **Lista de Tarjetas:**
```
┌─────────────────────────────────┐
│ 🏷️ Tarjeta Principal            │
│ UID: A1B2C3D4                   │
│ Creada: 10/11/2025              │
│ [Eliminar] [Editar]             │
└─────────────────────────────────┘
```

### **Historial:**
```
┌─────────────────────────────────┐
│ ✅ Tarjeta Principal (RFID)     │
│ 10/11/2025 14:30                │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ ❌ Tarjeta Desconocida (RFID)  │
│ 10/11/2025 12:15                │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 📱 Remote Access (REMOTE)       │
│ 09/11/2025 18:45                │
└─────────────────────────────────┘
```

### **Colores sugeridos:**
- ✅ Autorizado: Verde (#10b981)
- ❌ Denegado: Rojo (#ef4444)
- 🏷️ RFID: Azul (#3b82f6)
- 📱 Remote: Morado (#8b5cf6)

---

## 📦 **10. EJEMPLO COMPLETO DE SERVICIO ANGULAR**

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SaveApiService {
  private baseUrl = 'http://localhost:3001';

  constructor(private http: HttpClient) {}

  // AUTH
  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, { username, password });
  }

  // CARDS
  getCards(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cards`);
  }

  getDeletedCards(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cards/deleted`);
  }

  createCard(uid: string, name: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/cards`, { uid, name });
  }

  deleteCard(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cards/${id}`);
  }

  restoreCard(id: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/cards/${id}/restore`, {});
  }

  // ACCESS
  getHistory(filters?: {
    startDate?: string,
    endDate?: string,
    type?: 'RFID' | 'REMOTE',
    search?: string,
    page?: number,
    limit?: number
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }
    
    return this.http.get(`${this.baseUrl}/access/history`, { params });
  }

  openDoor(): Observable<any> {
    return this.http.post(`${this.baseUrl}/access/open`, {});
  }
}
```

---

## 📅 **11. EJEMPLOS DE FILTROS DE FECHA**

### **Todo el mes de Diciembre 2025**
```bash
GET /access/history?startDate=2025-12-01T00:00:00Z&endDate=2025-12-31T23:59:59Z
```

### **Primera semana de Diciembre**
```bash
GET /access/history?startDate=2025-12-01T00:00:00Z&endDate=2025-12-07T23:59:59Z
```

### **Solo el día 25 de Diciembre (Navidad)**
```bash
GET /access/history?startDate=2025-12-25T00:00:00Z&endDate=2025-12-25T23:59:59Z
```

### **Diciembre + Solo accesos RFID**
```bash
GET /access/history?startDate=2025-12-01T00:00:00Z&endDate=2025-12-31T23:59:59Z&type=RFID
```

### **Desde el 15 de Diciembre hasta hoy**
```bash
GET /access/history?startDate=2025-12-15T00:00:00Z
```

---

## 🚀 **RESUMEN RÁPIDO - LO ESENCIAL**

1. **Login primero** → Guardar token
2. **Token en TODAS las peticiones** (excepto login y validate)
3. **UID en MAYÚSCULAS** (el backend lo hace automático)
4. **Historial devuelve metadata de paginación** (usar para UI)
5. **Tarjetas eliminadas NO desaparecen** (soft delete, papelera)
6. **Rate limit en login** (5 intentos/15min)
7. **Errores 401** → Volver a login
8. **Fechas en formato ISO 8601** (YYYY-MM-DDTHH:mm:ss.sssZ)

---

## 📚 **DOCUMENTACIÓN ADICIONAL**

- **Swagger UI:** `http://localhost:3001/api`
- **Usuario por defecto:** `admin` / `admin123`
- **Puerto:** 3001
- **Timezone:** America/Mazatlan

---

**🎉 ¡Listo para integrar con tu frontend Ionic/Angular!**
