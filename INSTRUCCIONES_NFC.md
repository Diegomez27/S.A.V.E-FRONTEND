# 📱 **Guía de Instalación y Prueba de NFC en Celular**

## 🔧 **1. Instalación del Plugin NFC**

### **Paso 1: Instalar el plugin de NFC**
```bash
npm install @capgo/capacitor-nfc
```

### **Paso 2: Sincronizar con plataformas nativas**
```bash
npx cap sync
```

---

## 📦 **2. Configurar Permisos**

### **Android (AndroidManifest.xml)**
El plugin agrega automáticamente los permisos, pero verifica que existan en:
`android/app/src/main/AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.NFC" />
<uses-feature android:name="android.hardware.nfc" android:required="false" />
```

### **iOS**
iOS **NO soporta lectura de NFC NDEF** en modo background. Solo puede leer tags NFC específicos.
Para iOS necesitarías usar Core NFC pero tiene limitaciones.

---

## 📱 **3. Compilar y Probar en Android**

### **Opción A: Compilar para Android (APK)**

#### **1. Agregar plataforma Android (si no existe)**
```bash
npx cap add android
```

#### **2. Compilar el proyecto**
```bash
npm run build
npx cap sync
```

#### **3. Abrir en Android Studio**
```bash
npx cap open android
```

#### **4. En Android Studio:**
- Conecta tu celular por USB con **Depuración USB activada**
- O crea un APK: `Build > Build Bundle(s) / APK(s) > Build APK(s)`
- El APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`
- Transfiere el APK a tu celular e instálalo

---

### **Opción B: Ejecutar en modo desarrollo (Recomendado)**

#### **1. Conectar celular por USB**
- Activa **Depuración USB** en tu Android:
  - Configuración → Acerca del teléfono → Tocar 7 veces en "Número de compilación"
  - Configuración → Opciones de desarrollador → Activar "Depuración USB"

#### **2. Ejecutar en el dispositivo**
```bash
npm run build
npx cap sync
npx cap run android
```

Esto abrirá Android Studio y ejecutará la app directamente en tu celular.

---

## 🧪 **4. Probar la Funcionalidad NFC**

### **Requisitos:**
- ✅ Celular Android con NFC
- ✅ NFC activado en configuración
- ✅ Tarjetas NFC (MIFARE Classic, NTAG, etc.)

### **Pasos para probar:**

1. **Abre la app S.A.V.E** en tu celular
2. **Inicia sesión** con tus credenciales
3. **Ve a la tab "Tarjetas"**
4. **Toca el botón NFC** (ícono de teléfono azul)
5. **Acerca una tarjeta NFC** al lector (parte trasera del celular)
6. **Verás el UID** de la tarjeta en el modal
7. **Escribe un nombre** para la tarjeta
8. **Guarda** la tarjeta

### **Ubicación del lector NFC:**
- La mayoría de los celulares tienen el lector NFC en la **parte trasera**, cerca de la cámara
- Algunos modelos lo tienen en la **parte superior**
- Acerca la tarjeta NFC lentamente hasta que vibre o detecte

---

## 🐛 **5. Debugging y Solución de Problemas**

### **Ver logs en tiempo real:**
```bash
npx cap run android --livereload --external
```

### **Ver logs del dispositivo:**
```bash
adb logcat | grep -i "capacitor\|nfc"
```

### **Problemas comunes:**

#### ❌ **"NFC plugin not available"**
**Solución:** El plugin no está instalado
```bash
npm install @capgo/capacitor-nfc
npx cap sync
```

#### ❌ **"NFC no está disponible en este dispositivo"**
**Solución:** Tu celular no tiene chip NFC o no es compatible

#### ❌ **"NFC está deshabilitado"**
**Solución:** Activa NFC en:
- Configuración → Conexiones → NFC y pagos → Activar NFC

#### ❌ **"No se detecta la tarjeta"**
**Solución:**
- Asegúrate de acercar la tarjeta a la parte trasera del celular
- Mantén la tarjeta quieta por 2-3 segundos
- Algunas fundas metálicas bloquean NFC
- No todos los tipos de tarjetas NFC son compatibles

---

## 📋 **6. Comandos Rápidos**

### **Desarrollo con live reload:**
```bash
# Compilar
npm run build

# Sincronizar
npx cap sync

# Ejecutar en Android con recarga en vivo
npx cap run android --livereload --external --host=0.0.0.0
```

### **Producción:**
```bash
# Compilar en modo producción
npm run build --configuration=production

# Sincronizar
npx cap sync

# Generar APK firmado en Android Studio
# Build > Generate Signed Bundle / APK
```

---

## 🔍 **7. Verificar instalación del plugin**

### **Verificar que el plugin está instalado:**
```bash
npm list @capgo/capacitor-nfc
```

### **Ver versión de Capacitor:**
```bash
npx cap --version
```

### **Ver info de plugins:**
```bash
npx cap ls
```

---

## 📝 **8. Probar sin NFC (Modo Manual)**

Si tu celular no tiene NFC o quieres probar sin tarjetas:

1. En la página de Tarjetas, hay un **botón "+"** (naranja) en la esquina inferior derecha
2. **Toca el botón** 
3. En el modal, selecciona **"Agregar Manualmente"** (si existe) o ingresa el UID manualmente
4. Escribe un UID de prueba: `A1B2C3D4`
5. Escribe un nombre: `Tarjeta de Prueba`
6. Guarda

---

## ✅ **9. Checklist de Verificación**

Antes de probar en celular, verifica:

- [x] Plugin NFC instalado (`npm list @capgo/capacitor-nfc`)
- [x] Permisos en AndroidManifest.xml
- [x] Proyecto compilado (`npm run build`)
- [x] Sincronizado con Capacitor (`npx cap sync`)
- [x] Depuración USB activada en celular
- [x] NFC activado en el celular
- [x] Backend corriendo (localhost o Raspberry Pi accesible)
- [x] API URL configurada correctamente en `environment.ts`

---

## 🚀 **10. Siguiente Paso: Producción**

Para distribuir la app:

1. **Firma el APK** en Android Studio
2. **Sube a Google Play** (o distribución interna)
3. **Configura la URL del backend** en producción (IP de Raspberry Pi)

---

## 📞 **Soporte**

Si tienes problemas:
1. Revisa los logs con `adb logcat`
2. Verifica que el backend esté accesible desde el celular
3. Prueba con diferentes tipos de tarjetas NFC
4. Asegúrate de tener Android 6.0+

---

**¡Listo para probar! 🎉**
