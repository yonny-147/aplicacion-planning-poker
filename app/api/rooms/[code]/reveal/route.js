import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function POST(request, { params }) {
  const { code } = params
  const { participantId } = await request.json()

  const room = roomStore.getRoom(code)
  if (!room) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 })
  }

  const participant = room.participants.find((p) => p.id === participantId)
  if (!participant || !participant.isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const success = roomStore.revealVotes(code)

  if (!success) {
    return NextResponse.json({ error: "Error al revelar votos" }, { status: 400 })
  }

  const updatedRoom = roomStore.getRoom(code)
  return NextResponse.json(updatedRoom)
}
