import { NextResponse } from "next/server"
import roomStore from "@/lib/room-store"

export async function GET(request, { params }) {
  const { code } = params
  
  const listenerCount = roomStore.listeners.get(code)?.size || 0
  
  return NextResponse.json({
    roomCode: code,
    activeListeners: listenerCount,
    allListeners: Array.from(roomStore.listeners.keys()).map(key => ({
      room: key,
      count: roomStore.listeners.get(key)?.size || 0
    }))
  })
}
