import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function POST(request) {
  const { adminName, adminMode = "participant", adminId } = await request.json()

  if (!adminName || !adminName.trim()) {
    return NextResponse.json({ error: "El nombre del administrador es requerido" }, { status: 400 })
  }

  // Generar código único de sala
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  const room = roomStore.createRoom(roomCode, adminName.trim(), adminMode, adminId)

  // Obtener el ID del administrador
  const adminParticipantId = room.participants[0].id

  return NextResponse.json({
    room,
    roomCode,
    participantId: adminParticipantId,
  })
}
