# Configuración de Firebase para Planning Poker

## Requisitos

- Node.js (>= 16)
- pnpm (ya instalado si estás desarrollando el proyecto)
- Una cuenta de Firebase (gratuita)
- Un proyecto de Firebase creado

## Configuración Inicial de Firebase

### 1. Crear un Proyecto de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Haz clic en "Agregar proyecto" o "Add project"
3. Ingresa un nombre para tu proyecto (ej: "planning-poker")
4. Sigue los pasos del asistente (puedes deshabilitar Google Analytics si no lo necesitas)

### 2. Habilitar Realtime Database

1. En la consola de Firebase, ve a "Build" → "Realtime Database"
2. Haz clic en "Create Database"
3. Selecciona una ubicación (ej: `us-central1`)
4. Inicia en **modo de prueba** por ahora (configuraremos las reglas de seguridad después)

### 3. Obtener Credenciales de Service Account

1. En la consola de Firebase, ve a "Project Settings" (ícono de engranaje)
2. Ve a la pestaña "Service accounts"
3. Haz clic en "Generate new private key"
4. Se descargará un archivo JSON con tus credenciales
5. **IMPORTANTE**: Guarda este archivo de forma segura y **NUNCA** lo subas a Git

### 4. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTu-private-key-aqui\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://tu-project-id-default-rtdb.firebaseio.com
FIREBASE_PREFIX=planning-poker

# Alternativa: Usar el JSON completo del service account
# FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

**Cómo obtener estos valores del archivo JSON descargado:**

- `FIREBASE_PROJECT_ID`: El valor de `project_id`
- `FIREBASE_CLIENT_EMAIL`: El valor de `client_email`
- `FIREBASE_PRIVATE_KEY`: El valor de `private_key` (incluye los saltos de línea `\n`)
- `FIREBASE_DATABASE_URL`: En la consola, en Realtime Database, copia la URL de referencia

### 5. Instalar Dependencias

```bash
pnpm install
```

## Estructura de Datos en Realtime Database

La aplicación almacenará las salas en la siguiente estructura:

```
planning-poker/
  rooms/
    {roomCode}/
      code: "ABC123"
      participants: [...]
      stories: [...]
      currentStory: {...}
      isRevealed: false
      createdAt: 1234567890
```

## Reglas de Seguridad (Recomendadas para Producción)

Una vez que la aplicación esté funcionando, actualiza las reglas de seguridad en Firebase Console:

```json
{
    "rules": {
        "planning-poker": {
            "rooms": {
                "$roomCode": {
                    ".read": true,
                    ".write": true,
                    ".indexOn": ["createdAt"]
                }
            }
        }
    }
}
```

**Nota**: Estas reglas permiten lectura/escritura completa. Para producción, considera implementar autenticación y reglas más restrictivas.

## Desarrollo Local

1. Asegúrate de tener el archivo `.env.local` configurado
2. Ejecuta el servidor de desarrollo:

```bash
pnpm dev
```

3. La aplicación se conectará automáticamente a Firebase Realtime Database

## Verificación de Conexión

Para verificar que Firebase está configurado correctamente:

1. Revisa los logs de la consola al iniciar la aplicación
2. Deberías ver: `"Firebase Admin inicializado correctamente"`
3. En la consola de Firebase, ve a Realtime Database y verifica que se crean datos cuando usas la aplicación

## Monitoreo en Producción

En producción, la aplicación verifica automáticamente la conexión cada 5 minutos y registra el estado en los logs.

## Troubleshooting

### Error: "Failed to parse private key"

- Asegúrate de que `FIREBASE_PRIVATE_KEY` incluye las comillas y los saltos de línea `\n`
- Verifica que no haya espacios adicionales al copiar la clave

### Error: "Permission denied"

- Verifica que las reglas de seguridad en Firebase Console permitan lectura/escritura
- Asegúrate de que el service account tenga permisos de "Firebase Admin"

### Error: "FIREBASE_DATABASE_URL is not defined"

- Verifica que la variable de entorno esté configurada correctamente
- La URL debe tener el formato: `https://tu-project-id-default-rtdb.firebaseio.com`

### La aplicación no se conecta a Firebase

1. Verifica que todas las variables de entorno estén configuradas
2. Revisa los logs de la consola para errores específicos
3. Verifica que el proyecto de Firebase existe y Realtime Database está habilitado
4. Asegúrate de que el archivo de credenciales no ha expirado

## Migración desde Redis

Si estás migrando desde Redis:

- Todos los datos almacenados en Redis se perderán
- Las salas activas deberán recrearse
- No es necesario ejecutar Docker ni contenedores locales
- Firebase Realtime Database es un servicio en la nube completamente administrado

## Recursos Adicionales

- [Documentación de Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Firebase Admin SDK para Node.js](https://firebase.google.com/docs/admin/setup)
- [Reglas de Seguridad](https://firebase.google.com/docs/database/security)
