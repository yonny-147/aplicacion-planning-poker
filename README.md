# Planning Poker App

## Requisitos

- Node.js (>= 16)
- pnpm
- Una cuenta de Firebase (gratuita)

## Configuración

1. Instala las dependencias:

```bash
pnpm install
```

2. Configura Firebase:

- Ver instrucciones detalladas en [FIREBASE.md](FIREBASE.md)
- Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
- Habilita Realtime Database
- Descarga las credenciales del service account

3. Crea un archivo `.env.local` basado en `.env.example`:

```bash
cp .env.example .env.local
```

4. Completa las variables de entorno en `.env.local` con tus credenciales de Firebase.

5. Inicia el servidor de desarrollo:

```bash
pnpm dev
```

_Automatically synced with your [v0.app](https://v0.app) deployments_

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/yonny-alexander-ospinas-projects/v0-aplicacion-planning-poker)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/Ln4LIOwxsvq)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/yonny-alexander-ospinas-projects/v0-aplicacion-planning-poker](https://vercel.com/yonny-alexander-ospinas-projects/v0-aplicacion-planning-poker)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/Ln4LIOwxsvq](https://v0.app/chat/projects/Ln4LIOwxsvq)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
