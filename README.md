# Planning Poker App

## Requisitos

- Node.js (>= 16)
- pnpm
- Una cuenta de Firebase (gratuita)

## Estado Actual

⚠️ **La aplicación está configurada como frontend-only**. Todas las rutas API han sido eliminadas para facilitar la integración directa con Firebase.

## Configuración

1. Instala las dependencias:

```bash
pnpm install
```

2. Configura Firebase:

- Ver instrucciones detalladas en [FIREBASE.md](FIREBASE.md)
- Para integración frontend, ver [FRONTEND_SETUP.md](FRONTEND_SETUP.md)

3. **Opción A - Firebase Client SDK (Recomendado):**

```bash
pnpm add firebase
```

Crea `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://tu-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-project-id
```

4. **Opción B - Firebase Admin SDK:**
   Ver [FIREBASE.md](FIREBASE.md) para configuración completa.

5. Inicia el servidor de desarrollo:

```bash
pnpm dev
```

## Próximos Pasos

Lee [FRONTEND_SETUP.md](FRONTEND_SETUP.md) para:

- Opciones de integración con Firebase
- Estructura de datos recomendada
- Ejemplos de código
- Guía de implementación

## Documentación

- [FIREBASE.md](FIREBASE.md) - Setup de Firebase
- [FRONTEND_SETUP.md](FRONTEND_SETUP.md) - Integración frontend
- [docs/REACT_QUERY.md](docs/REACT_QUERY.md) - Uso de React Query (TanStack Query) en la app
- [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) - Historial de cambios

---

_Automatically synced with your [v0.app](https://v0.app) deployments_

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/yonny-alexander-ospinas-projects/v0-aplicacion-planning-poker)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/Ln4LIOwxsvq)