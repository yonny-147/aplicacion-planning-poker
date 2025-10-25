import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function POST(request, { params }) {
  try {
    const { code } = params
    const { participantId } = await request.json()

    // Validación de parámetros
    if (!code || !participantId) {
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

    // Validar permisos
    const participant = room.participants?.find((p) => p.id === participantId)
    if (!participant?.isAdmin) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    // Validar que haya una historia actual
    if (!room.currentStory) {
      return NextResponse.json(
        { error: "No hay historia activa para revelar" },
        { status: 400 }
      )
    }

    // IMPORTANTE: await para revelar votos
    const success = await roomStore.revealVotes(roomCode)
    if (!success) {
      return NextResponse.json(
        { error: "Error al revelar votos" },
        { status: 500 }
      )
    }

    // IMPORTANTE: await para obtener la sala actualizada
    const updatedRoom = await roomStore.getRoom(roomCode)
    return NextResponse.json(updatedRoom)

  } catch (error) {
    console.error("Error revealing votes:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}