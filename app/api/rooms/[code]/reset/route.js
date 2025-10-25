import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function POST(request, { params }) {
  const { code } = params
  const { participantId } = await request.json()
  console.log(`[Reset] Solicitud de reset para sala ${code} por participante ${participantId}`)

  const room = await roomStore.getRoom(code)
  if (!room) {
  console.log(`[Reset] Sala no encontrada ${code}`)
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 })
  }

  const participant = room.participants?.find((p) => p.id === participantId)
  console.log(`[Reset] Verificando permisos:`, { participantId, participant })
  if (!participant || !participant.isAdmin) {
  console.log(`[Reset] No autorizado para reset en sala ${code}`)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const success = await roomStore.resetVotes(code)

  if (!success) {
  console.log(`[Reset] Error interno al resetear votos en sala ${code}`)
    return NextResponse.json({ error: "Error al resetear votos" }, { status: 400 })
  }

  const updatedRoom = await roomStore.getRoom(code)
  console.log(`[Reset] Reset exitoso en sala ${code}`)
  return NextResponse.json(updatedRoom)
}
