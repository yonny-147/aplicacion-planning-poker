import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function POST(request, { params }) {
  const { code } = params
  const { participantId, mode } = await request.json()

  // Normalizar el código de sala para evitar problemas por mayúsculas/minúsculas
  const roomCode = code?.toUpperCase()

  const room = await roomStore.getRoom(roomCode)
  if (!room) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 })
  }

  const participant = room.participants.find((p) => p.id === participantId)
  if (!participant || !participant.isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const allowedModes = ["participant", "facilitator"]
  if (!allowedModes.includes(mode)) {
    return NextResponse.json({ error: "Modo inválido" }, { status: 400 })
  }

  try {
    const success = await roomStore.setAdminMode(roomCode, participantId, mode)
    if (!success) {
      return NextResponse.json({ error: "Error al cambiar modo" }, { status: 500 })
    }

    const updatedRoom = await roomStore.getRoom(roomCode)
    if (!updatedRoom) {
      return NextResponse.json({ error: "Error al obtener la sala actualizada" }, { status: 500 })
    }

    return NextResponse.json(updatedRoom)
  } catch (error) {
    console.error("Error setting admin mode:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
