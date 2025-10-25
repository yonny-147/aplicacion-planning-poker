import Redis from "ioredis"

const isProd = process.env.NODE_ENV === "production"

// Configuración según ambiente
const config = {
  // URL de conexión
  url: process.env.REDIS_URL || "redis://localhost:6379",
  
  // Log en desarrollo para depuración
  showFriendlyErrorStack: !isProd,
  
  // Opciones comunes
  options: {
    // Reintentos exponenciales hasta 2 segundos
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    
    // Tiempo máximo de reconexión (30 seg en prod, 5 en dev)
    maxRetriesPerRequest: isProd ? 30 : 5,
    
    // Pool de conexiones (más en prod)
    enableReadyCheck: true,
    
    // Timeouts más estrictos en producción
    connectTimeout: isProd ? 20000 : 5000,
    commandTimeout: isProd ? 15000 : 3000,
    
    // Keepalive para evitar desconexiones
    keepAlive: 30000,
    
    // TLS en producción
    tls: isProd ? {
      rejectUnauthorized: true,
      // Si usas certificado personalizado:
      // ca: fs.readFileSync('./redis-ca.crt')
    } : undefined,
    
    // Compresión en producción
    enableCompression: isProd,
  }
}

// Cliente Redis con la configuración
const redis = new Redis(config.url, config.options)

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

// En producción, monitorear la salud
if (isProd) {
  setInterval(async () => {
    try {
      const info = await redis.info("memory")
      const [usedMemory] = info.match(/used_memory_human:(\S+)/)
      console.log(`Redis memoria usada: ${usedMemory}`)
    } catch (err) {
      console.error("Error monitoreando Redis:", err)
    }
  }, 300000) // cada 5 minutos
}

export const REDIS_PREFIX = process.env.REDIS_PREFIX || "planning-poker:"

// Exportar cliente configurado
export default redis