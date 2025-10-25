import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function DELETE(request, { params }) {
  const { code, storyId } = params
  const { searchParams } = new URL(request.url)
  const participantId = searchParams.get("participantId")

  const room = await roomStore.getRoom(code)
  if (!room) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 })
  }

  const participant = room.participants.find((p) => p.id === participantId)
  if (!participant || !participant.isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const success = await roomStore.deleteStory(code, storyId)

  if (!success) {
    return NextResponse.json({ error: "Error al eliminar historia" }, { status: 400 })
  }

  const updatedRoom = await roomStore.getRoom(code)
  return NextResponse.json(updatedRoom)
}
