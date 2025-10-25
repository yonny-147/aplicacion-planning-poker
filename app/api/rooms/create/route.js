import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function POST(request) {
  const { adminName, adminMode = "participant", adminId } = await request.json()

  if (!adminName || !adminName.trim()) {
    return NextResponse.json({ error: "El nombre del administrador es requerido" }, { status: 400 })
  }

  try {
    // Generar código único de sala
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    const room = await roomStore.createRoom(roomCode, adminName.trim(), adminMode, adminId)
    if (!room) {
      return NextResponse.json({ error: "Error al crear la sala" }, { status: 500 })
    }

    // Obtener el ID del administrador
    const adminParticipantId = room.participants[0].id

    return NextResponse.json({
      room,
      roomCode,
      participantId: adminParticipantId,
    })
  } catch (error) {
    console.error("Error creating room:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
