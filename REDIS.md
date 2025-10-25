# Configuración de Redis para Planning Poker

## Requisitos
- Docker instalado en tu máquina local
- Node.js y pnpm (ya instalados si estás desarrollando el proyecto)

## Pasos para ejecutar Redis localmente

1. Inicia Redis usando Docker:
```powershell
docker run --name planning-poker-redis -p 6379:6379 -d redis:alpine
```

2. Verifica que Redis está corriendo:
```powershell
docker ps
```
Deberías ver un contenedor llamado "planning-poker-redis" en la lista.

3. Para detener Redis:
```powershell
docker stop planning-poker-redis
```

4. Para iniciar Redis nuevamente (después de reiniciar):
```powershell
docker start planning-poker-redis
```

## Variables de entorno
El proyecto usa estas variables en `.env.local`:
```
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=planning-poker:
```

## Persistencia
- Las salas se guardan en Redis con un TTL de 7 días
- Cada sala usa una key con el formato `planning-poker:room:{código}`
- Los datos se mantienen entre reinicios del servidor Next.js

## Comandos útiles para debugging

1. Entrar al CLI de Redis:
```powershell
docker exec -it planning-poker-redis redis-cli
```

2. Ver todas las keys de Planning Poker:
```
KEYS planning-poker:*
```

3. Ver contenido de una sala específica:
```
GET planning-poker:room:{código}
```

4. Eliminar todas las keys del proyecto:
```
DEL planning-poker:*
```

## Troubleshooting

Si tienes problemas de conexión:

1. Verifica que el contenedor está corriendo:
```powershell
docker ps
```

2. Revisa los logs:
```powershell
docker logs planning-poker-redis
```

3. Asegúrate que el puerto 6379 está disponible:
```powershell
netstat -an | findstr "6379"
```