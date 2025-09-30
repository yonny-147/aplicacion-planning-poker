import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function GET(request, { params }) {
  const { code } = params

  const room = roomStore.getRoom(code)

  if (!room) {
    return NextResponse.json({ exists: false }, { status: 404 })
  }

  return NextResponse.json({
    exists: true,
    code: room.code,
    participantCount: room.participants.length,
  })
}
