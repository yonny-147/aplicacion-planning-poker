import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function POST(request, { params }) {
  try {
    const { code } = params
    console.log('[API Join] Joining room:', code)
    
    const body = await request.json()
    console.log('[API Join] Request body:', body)
    
    const { participantName, participantId, role } = body

    let room = await roomStore.getRoom(code)

    // Si la sala no existe, retornar error
    if (!room) {
      console.error('[API Join] Room not found:', code)
      return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 })
    }

    // Asegurarnos de que participants es un array
    const participants = Array.isArray(room.participants) ? room.participants : []

    // Comparar nombres normalizados para evitar falsos positivos por espacios o mayúsculas
    const normalizedIncoming = (participantName || "").trim().toLowerCase()
    const existingParticipant = participants.find((p) => {
      const name = (p && p.name) ? String(p.name).trim().toLowerCase() : ""
      return name === normalizedIncoming
    })

    if (existingParticipant) {
      console.log('[API Join] Existing participant found:', existingParticipant.id)
      // Si el participante existe y tiene el mismo ID, permitir re-unión
      if (participantId && existingParticipant.id === participantId) {
        // Actualizar el rol si se proporciona uno nuevo
        if (role !== undefined && existingParticipant.role !== role) {
          console.log('[API Join] Updating role:', role)
          await roomStore.updateParticipantRole(code, existingParticipant.id, role)
          room = await roomStore.getRoom(code)
        }
        return NextResponse.json({ room, participantId: existingParticipant.id })
      }
      // Si el participante existe pero con diferente ID, es un nombre duplicado real
      console.log('[API Join] Duplicate name detected')
      return NextResponse.json({ error: "Este nombre ya está en uso. Por favor elige otro nombre." }, { status: 409 })
    }

    // Agregar nuevo participante (usar el ID proporcionado si existe)
    console.log('[API Join] Adding new participant:', { participantName, participantId, role })
    const participant = await roomStore.addParticipant(code, participantName, participantId, role)
    if (!participant) {
      console.error('[API Join] Failed to add participant')
      return NextResponse.json({ error: "Error al unirse a la sala" }, { status: 500 })
    }

    room = await roomStore.getRoom(code)
    console.log('[API Join] Successfully joined room')
    return NextResponse.json({ room, participantId: participant.id })
  } catch (error) {
    console.error("[API Join] Error joining room:", error)
    return NextResponse.json({ error: "Error interno del servidor", details: error.message }, { status: 500 })
  }
}
