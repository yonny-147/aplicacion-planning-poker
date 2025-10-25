import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function DELETE(request, { params }) {
  try {
    const { code } = params
    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get("participantId")

    if (!participantId) {
      return NextResponse.json({ error: "Participante no identificado" }, { status: 400 })
    }

    // Verificar que la sala existe
    const room = await roomStore.getRoom(code)
    if (!room) {
      return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 })
    }

    // Verificar que el participante es administrador
    const participant = room.participants?.find((p) => p.id === participantId)
    if (!participant || !participant.isAdmin) {
      return NextResponse.json({ error: "Solo el administrador puede eliminar la sala" }, { status: 403 })
    }

    // Eliminar la sala
    const deleted = await roomStore.deleteRoom(code)
    
    if (!deleted) {
      return NextResponse.json({ error: "Error al eliminar la sala" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: "Sala eliminada exitosamente" 
    })
  } catch (error) {
    console.error("Error en DELETE /api/rooms/[code]/delete:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
