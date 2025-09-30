import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function POST(request, { params }) {
  const { code } = params
  const { title, description, participantId } = await request.json()

  const room = roomStore.getRoom(code)
  if (!room) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 })
  }

  const participant = room.participants.find((p) => p.id === participantId)
  if (!participant || !participant.isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  if (!title || title.trim() === "") {
    return NextResponse.json({ error: "El título es requerido" }, { status: 400 })
  }

  const story = roomStore.addStory(code, { title, description })

  if (!story) {
    return NextResponse.json({ error: "Error al crear historia" }, { status: 400 })
  }

  const updatedRoom = roomStore.getRoom(code)
  return NextResponse.json(updatedRoom)
}
