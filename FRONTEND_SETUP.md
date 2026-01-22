# Planning Poker - Frontend Only Setup

## Estado Actual

La aplicación ahora está configurada como **frontend-only** con Firebase listo para integración.

## ✅ Cambios Realizados

### Eliminado

- ❌ Todo el directorio `/app/api` (todas las rutas de API)
- ❌ Archivo `lib/room-store.js` (lógica de backend)
- ❌ Caché de Next.js (`.next/`)
- ❌ Todas las dependencias de Redis

### Mantenido

- ✅ `/app/page.js` - Página principal (crear/unirse a sala)
- ✅ `/app/join/[code]` - Página para unirse a sala
- ✅ `/app/room/[code]` - Página de la sala de votación
- ✅ Todos los componentes UI en `/components`
- ✅ Estilos y configuración de Tailwind

### Creado

- ✅ `lib/firebase.js` - Configuración de Firebase Admin SDK
- ✅ `lib/utils.js` - Utilidades para el frontend

## 📁 Estructura Actual

```
aplicacion-planning-poker/
├── app/
│   ├── page.js              # Página principal
│   ├── join/[code]/         # Unirse a sala
│   ├── room/[code]/         # Sala de votación
│   ├── layout.tsx
│   └── globals.css
├── components/              # Componentes UI (intactos)
├── lib/
│   ├── firebase.js         # Firebase config
│   └── utils.js            # Utilidades
├── FIREBASE.md             # Guía de setup
├── MIGRATION_SUMMARY.md    # Resumen de migración
└── .env.example            # Template de variables
```

## 🔧 Próximos Pasos para Integrar Firebase

### 1. Configurar Firebase

Sigue las instrucciones en `FIREBASE.md`:

1. Crear proyecto en Firebase Console
2. Habilitar Realtime Database
3. Descargar credenciales
4. Configurar `.env.local`

### 2. Integración Recomendada

Puedes integrar Firebase de dos formas:

#### Opción A: Cliente Directo (Recomendado para simplicidad)

Usar Firebase Client SDK directamente desde el frontend:

```bash
pnpm add firebase
```

Crear `lib/firebase-client.js`:

```javascript
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
```

Luego en tus componentes:

```javascript
import { ref, set, onValue } from "firebase/database";
import { db } from "@/lib/firebase-client";

// Crear sala
const createRoom = async () => {
    const roomCode = generateRoomCode();
    await set(ref(db, `planning-poker/rooms/${roomCode}`), {
        code: roomCode,
        participants: [],
        stories: [],
        createdAt: Date.now(),
    });
};

// Escuchar cambios en tiempo real
useEffect(() => {
    const roomRef = ref(db, `planning-poker/rooms/${code}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        setRoom(data);
    });
    return () => unsubscribe();
}, [code]);
```

#### Opción B: API Routes con Firebase Admin

Recrear rutas API usando Firebase Admin SDK (más complejo pero mejor separación):

```javascript
// app/api/rooms/create/route.js
import db from "@/lib/firebase";

export async function POST(request) {
    const { adminName } = await request.json();
    const roomCode = generateRoomCode();

    await db.ref(`planning-poker/rooms/${roomCode}`).set({
        code: roomCode,
        participants: [{ name: adminName, isAdmin: true }],
        stories: [],
        createdAt: Date.now(),
    });

    return Response.json({ roomCode });
}
```

### 3. Actualizar Componentes Frontend

Los componentes en `/app/page.js`, `/app/join/[code]`, y `/app/room/[code]` actualmente hacen llamadas a `/api/*` que ya no existen.

**Necesitas actualizar:**

- `app/page.js` líneas 30-37 (createRoom)
- `app/page.js` líneas 68-74 (joinRoom)
- Componentes en `app/room/[code]` para usar Firebase directamente

### 4. Estructura de Datos en Firebase

```
planning-poker/
  rooms/
    {roomCode}/
      code: "ABC123"
      participants: [
        { id: "...", name: "...", isAdmin: true, vote: null }
      ]
      stories: [
        { id: "...", title: "...", votes: [] }
      ]
      currentStory: { id: "..." }
      isRevealed: false
      createdAt: 1234567890
```

## 🚀 Para Desarrollar

```bash
# Instalar dependencias
pnpm install

# Limpiar caché si hay problemas
rm -rf .next

# Modo desarrollo
pnpm dev
```

## ⚠️ Notas Importantes

1. **La app no funciona actualmente** - Las páginas intentan llamar a APIs que ya no existen
2. **Necesitas elegir una opción** - Cliente directo (más simple) o API Routes (más estructurado)
3. **Firebase Client SDK es más simple** - Para una app de este tamaño, usar Firebase directamente desde el cliente es lo más sencillo
4. **No necesitas Firebase Admin** si usas el Client SDK - Solo necesitas las credenciales públicas

## 📚 Recursos

- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
- [Realtime Database Web](https://firebase.google.com/docs/database/web/start)
- [Next.js con Firebase](https://firebase.google.com/docs/hosting/nextjs)

---

**Recomendación:** Usa Firebase Client SDK directamente desde el frontend para máxima simplicidad.
