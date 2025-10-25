import { createClient } from 'redis'

const isProd = process.env.NODE_ENV === "production"

// Cliente Redis con la configuración
const redis = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    connectTimeout: isProd ? 20000 : 5000,
    keepAlive: 30000,
    // TLS se activa automáticamente en Redis Cloud, no necesitas configurarlo manualmente
  }
})

// Manejo de eventos
redis.on("error", (err) => {
  console.error("Redis Error:", err)
  // En producción podrías enviar a un servicio de logging
  if (isProd) {
    // TODO: Enviar a servicio de logging
  }
})

redis.on("connect", () => {
  console.log("Redis conectado")
})

redis.on("ready", () => {
  console.log("Redis listo para recibir comandos")
})

// Conectar al iniciar
await redis.connect()

// En producción, monitorear la salud
if (isProd) {
  setInterval(async () => {
    try {
      const info = await redis.info('memory')
      const match = info.match(/used_memory_human:(\S+)/)
      if (match) {
        console.log(`Redis memoria usada: ${match[1]}`)
      }
    } catch (err) {
      console.error("Error monitoreando Redis:", err)
    }
  }, 300000) // cada 5 minutos
}

export const REDIS_PREFIX = process.env.REDIS_PREFIX || "planning-poker:"

// Exportar cliente configurado
export default redis