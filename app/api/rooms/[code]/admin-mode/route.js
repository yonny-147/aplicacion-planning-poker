import roomStore from "@/lib/room-store"

export async function POST(request, { params }) {
  const { code } = params
  const { participantId, mode } = await request.json()

  const room = roomStore.getRoom(code)
  if (!room) {
    return Response.json({ error: "Sala no encontrada" }, { status: 404 })
  }

  const participant = room.participants.find((p) => p.id === participantId)
  if (!participant || !participant.isAdmin) {
    return Response.json({ error: "No autorizado" }, { status: 403 })
  }

  const success = roomStore.setAdminMode(code, participantId, mode)
  if (!success) {
    return Response.json({ error: "Error al cambiar modo" }, { status: 500 })
  }

  return Response.json(roomStore.getRoom(code))
}
