# PROYECTO S.A.V.E. 2.0 - DOCUMENTACIÓN TÉCNICA

## 1. PINES DE CONEXIÓN (ESP32 -> Periféricos)

### Lector RC522 (SPI)
- SDA (SS) -> GPIO 21
- SCK      -> GPIO 18
- MOSI     -> GPIO 23
- MISO     -> GPIO 19
- GND      -> GND
- 3.3V     -> 3V3

### Módulo Relé
- IN1      -> GPIO 22
- VCC      -> VIN (5V)
- GND      -> GND

## 2. ARQUITECTURA DE RED
- Desarrollo: Laptop (Backend + Frontend) -> Raspberry Pi (Despliegue final).
- Producción: Raspberry Pi con IP Estática (ej. 192.168.4.1) actuando como Hotspot (hostapd + dnsmasq).

## 3. ESQUEMA DE BASE DE DATOS (Entidades TypeORM)
- User: id, username, password_hash (Para login en la app).
- Card: id, uid (único), name, isEnabled (Para gestión de acceso).
- AccessLog: id, cardUid, cardName, wasAuthorized, type (RFID/REMOTE), timestamp.

## 4. FLUJO DE DATOS
1. ESP32 lee UID -> POST /access/validate -> Backend responde {authorized: true/false}.
2. App hace Login -> POST /auth/login -> Recibe JWT.
3. App escanea NFC -> POST /cards (con JWT) -> Guarda tarjeta nueva.
4. App pide historial -> GET /access/history (con JWT).

## 5. LISTA DE MATERIALES
- Placa ESP32.
- Lector RFID-RC522.
- Módulo Relé 5V.
- Cerradura Solenoide 12V.
- Fuente 12V 1A.
- Protoboard y Cables Jumper (M-H).
