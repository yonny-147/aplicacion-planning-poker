import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function GET(request, { params }) {
  const { code } = params
  const room = await roomStore.getRoom(code)

  if (!room) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 })
  }

  return NextResponse.json(room)
}
