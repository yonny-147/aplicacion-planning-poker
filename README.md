# Planning Poker App

## Requisitos

- Node.js (>= 16)
- pnpm
- Docker (para Redis)

## Configuración

1. Instala las dependencias:
```bash
pnpm install
```

2. Configura Redis localmente:
- Ver instrucciones detalladas en [REDIS.md](REDIS.md)
- O ejecuta rápidamente:
```powershell
docker run --name planning-poker-redis -p 6379:6379 -d redis:alpine
```

3. Crea un archivo `.env.local`:
```
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=planning-poker:
```

*Automatically synced with your [v0.app](https://v0.app) deployments*

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
