import roomStore from "@/lib/room-store"

// Server-Sent Events para sincronización en tiempo real
export async function GET(request, { params }) {
  const { code } = params

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Enviar estado inicial
      const room = roomStore.getRoom(code)
      if (room) {
        const data = `data: ${JSON.stringify(room)}\n\n`
        controller.enqueue(encoder.encode(data))
      }

      // Polling cada 1 segundo para detectar cambios
      const interval = setInterval(() => {
        const room = roomStore.getRoom(code)
        if (room) {
          const data = `data: ${JSON.stringify(room)}\n\n`
          controller.enqueue(encoder.encode(data))
        } else {
          clearInterval(interval)
          controller.close()
        }
      }, 1000)

      // Cleanup cuando se cierra la conexión
      request.signal.addEventListener("abort", () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
