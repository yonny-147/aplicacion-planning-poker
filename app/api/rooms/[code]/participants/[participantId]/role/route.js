import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function POST(request, { params }) {
  try {
    const { code, participantId } = params
    console.log('[API Role] Params:', { code, participantId })
    
    const body = await request.json()
    console.log('[API Role] Body:', body)
    
    let { role } = body

    if (role === undefined || role === null) {
      console.error('[API Role] Role is undefined or null')
      return NextResponse.json({ error: "Role is required" }, { status: 400 })
    }

    // Obtener la sala y verificar que el participante existe
    const room = await roomStore.getRoom(code)
    if (!room) {
      console.error('[API Role] Room not found:', code)
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Verificar que el participante no sea administrador
    const participant = room.participants?.find((p) => p.id === participantId)
    if (!participant) {
      console.error('[API Role] Participant not found:', participantId)
      return NextResponse.json({ error: "Participant not found" }, { status: 404 })
    }

    console.log('[API Role] Participant found:', participant)

    if (participant.isAdmin) {
      console.error('[API Role] Admin cannot change role')
      return NextResponse.json({ error: "Administrators cannot change their role" }, { status: 403 })
    }

    // Validar que el rol sea uno de los permitidos
    const validRoles = ["DEV", "QA", "FACILITATOR", ""]
    if (!validRoles.includes(role)) {
      console.error('[API Role] Invalid role:', role)
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const success = await roomStore.updateParticipantRole(code, participantId, role)

    if (!success) {
      console.error('[API Role] Failed to update role')
      return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
    }

    const updatedRoom = await roomStore.getRoom(code)
    console.log('[API Role] Role updated successfully')
    return NextResponse.json({ success: true, room: updatedRoom })
  } catch (error) {
    console.error("[API Role] Error updating participant role:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
