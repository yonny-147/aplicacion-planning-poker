import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function POST(request, { params }) {
  const { code } = params
  const { participantId, vote, role } = await request.json()

    const success = await roomStore.submitVote(code, participantId, vote, role)

  if (!success) {
    return NextResponse.json({ error: "Error al registrar voto" }, { status: 400 })
  }

    const room = await roomStore.getRoom(code)
  return NextResponse.json(room)
}
