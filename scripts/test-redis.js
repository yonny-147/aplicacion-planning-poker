import redis from '../lib/redis.js'

async function test() {
  try {
    const pong = await redis.ping()
    console.log('PING:', pong)

    const info = await redis.info('server')
    console.log('INFO server ok')

    // List keys con el prefijo
    const prefix = process.env.REDIS_PREFIX || 'planning-poker:'
    const keys = await redis.keys(`${prefix}*`)
    console.log('Found keys count:', keys.length)
    if (keys.length > 0) console.log(keys.slice(0, 10))

    await redis.quit()
  } catch (err) {
    console.error('Redis test error:', err)
    process.exit(1)
  }
}

test()
