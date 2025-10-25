import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function POST(request, { params }) {
  const { code, participantId } = params
  const { adminId } = await request.json()

  const room = await roomStore.getRoom(code)
  if (!room) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 })
  }

  // Verificar si el adminId corresponde a un administrador
  const admin = Array.isArray(room.participants)
    ? room.participants.find((p) => p.id === adminId && p.isAdmin)
    : undefined

  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  // Eliminar participante
  await roomStore.removeParticipant(code, participantId)

  const updatedRoom = await roomStore.getRoom(code)
  return NextResponse.json(updatedRoom)
}
