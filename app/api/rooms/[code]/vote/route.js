import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function POST(request, { params }) {
  const { code } = params
  const { participantId, vote } = await request.json()

  const success = roomStore.submitVote(code, participantId, vote)

  if (!success) {
    return NextResponse.json({ error: "Error al registrar voto" }, { status: 400 })
  }

  const room = roomStore.getRoom(code)
  return NextResponse.json(room)
}
