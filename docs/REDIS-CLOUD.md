# Conectar Redis Cloud desde local (de forma segura)

Este documento explica cómo conectar tu entorno local al Redis Cloud de producción sin poner en riesgo los datos de producción.

IMPORTANTE: Nunca comites tus credenciales en el repositorio. Usa un archivo `.env.local` que esté en `.gitignore`.

## Estrategias seguras

1) Usar un prefijo distinto para desarrollo

	- Establece `REDIS_PREFIX=planning-poker-dev:` en tu `.env.local` cuando te conectes con credenciales de producción.
	- Esto separa las keys de tu entorno local de las keys de producción y evita colisiones accidentales.

2) Crear un usuario ACL limitado en Redis Cloud

	- En Redis Cloud crea un usuario con ACLs limitadas, por ejemplo sólo los comandos `GET`, `SET`, `KEYS`, `PING` y `INFO`.
	- Evita dar permisos de `FLUSHALL`, `SAVE`, `DEBUG` o `CONFIG`.
	- Usa ese usuario en tu `REDIS_URL`, por ejemplo:
	  `rediss://limited_user:password@host:port`

3) Usar TLS/SSL

	- Conéctate usando `rediss://...` y habilita `tls` en la configuración del cliente.
	- No desactives la verificación de certificados (`rejectUnauthorized: false`) en producción o en conexiones reales.

4) Prefijo + base de datos separado

	- Si Redis Cloud soporta múltiples DBs, usa una DB separada para pruebas y otra para prod.
	- Alternativamente, usa prefijos para distinguir los entornos.

5) Evitar cambios destructivos desde local

	- No ejecutes comandos como `DEL planning-poker:*` en la instancia de producción.
	- Usa scripts de solo-lectura para inspección o crea snapshots para migración.

## Pasos para conectar localmente (ejemplo)

1. Copia `.env.local.example` a `.env.local` y rellena la URL de Redis Cloud y un prefijo:

```
REDIS_URL=rediss://limited_user:password@host:port
REDIS_PREFIX=planning-poker-dev:
NODE_ENV=development
```

2. Ejecuta un test de conexión (script incluido):

```powershell
node ./scripts/test-redis.js
```

3. Si `PING` responde `PONG` y no se listan keys sensibles, la conexión funciona.

## Uso de Docker para desarrollo (recomendado)

Si prefieres no tocar la instancia de producción, levanta Redis localmente con Docker:

1. Levanta Redis con docker-compose:

```powershell
docker-compose up -d
```

2. Verifica que el contenedor corra:

```powershell
docker ps
```

3. En `.env.local` apunta a la instancia local:

```
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=planning-poker-local:
NODE_ENV=development
```

4. Ejecuta el test:

```powershell
node ./scripts/test-redis.js
```

## Alternar entre Redis local y Redis Cloud

- Para desarrollo rápido usa Redis local (Docker) y `REDIS_URL=redis://localhost:6379`.
- Para pruebas con datos reales (muy cuidadoso) puedes usar `REDIS_URL` apuntando a Redis Cloud, pero cambia `REDIS_PREFIX` para evitar colisiones.
- En producción configura `REDIS_URL` en tu proveedor (Vercel) apuntando a Redis Cloud y `NODE_ENV=production`.

## Migración de datos (opcional)

- Para copiar datos de producción a local, exporta en producción y luego importa en una instancia local separada. No importe datos directos a la base de producción.

## Resumen de buenas prácticas

- No comites credenciales.
- Usa prefijos o DBs separados.
- Crea usuarios ACL con permisos limitados.
- Usa TLS y verifica certificados.
- Evita comandos destructivos desde local.

