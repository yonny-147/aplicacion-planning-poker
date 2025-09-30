import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function POST(request, { params }) {
  const { code } = params
  const { participantName, participantId } = await request.json()

  let room = roomStore.getRoom(code)

  // Si la sala no existe, retornar error
  if (!room) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 })
  }

  const existingParticipant = room.participants.find((p) => p.name === participantName)

  if (existingParticipant) {
    // Si el participante existe y tiene el mismo ID, permitir re-unión
    if (participantId && existingParticipant.id === participantId) {
      return NextResponse.json({ room, participantId: existingParticipant.id })
    }
    // Si el participante existe pero con diferente ID, es un nombre duplicado real
    return NextResponse.json({ error: "Este nombre ya está en uso. Por favor elige otro nombre." }, { status: 409 })
  }

  // Agregar nuevo participante (usar el ID proporcionado si existe)
  const participant = roomStore.addParticipant(code, participantName, participantId)
  room = roomStore.getRoom(code)

  return NextResponse.json({ room, participantId: participant.id })
}
