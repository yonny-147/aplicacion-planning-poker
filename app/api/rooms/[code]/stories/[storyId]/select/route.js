import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function POST(request, { params }) {
  try {
    const { code, storyId } = params
    const { participantId } = await request.json()

    // Validación de parámetros
    if (!code || !storyId || !participantId) {
      return NextResponse.json(
        { error: "Parámetros faltantes" },
        { status: 400 }
      )
    }

    const roomCode = code.toUpperCase()

    // IMPORTANTE: await para obtener la sala
    const room = await roomStore.getRoom(roomCode)
    if (!room) {
      return NextResponse.json(
        { error: "Sala no encontrada" },
        { status: 404 }
      )
    }

    // Validar que stories exista
    if (!Array.isArray(room.stories)) {
      return NextResponse.json(
        { error: "No hay historias en la sala" },
        { status: 400 }
      )
    }

    // Validar que la historia exista
    const story = room.stories.find((s) => s.id === storyId)
    if (!story) {
      return NextResponse.json(
        { error: "Historia no encontrada" },
        { status: 404 }
      )
    }

    // Validar permisos
    const participant = room.participants?.find((p) => p.id === participantId)
    if (!participant?.isAdmin) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    // IMPORTANTE: await para establecer la historia
    const success = await roomStore.setCurrentStory(roomCode, storyId)
    if (!success) {
      return NextResponse.json(
        { error: "Error al seleccionar historia" },
        { status: 500 }
      )
    }

    // IMPORTANTE: await para obtener la sala actualizada
    const updatedRoom = await roomStore.getRoom(roomCode)
    return NextResponse.json(updatedRoom)

  } catch (error) {
    console.error("Error selecting story:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}