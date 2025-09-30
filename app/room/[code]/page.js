"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useRoom } from "@/hooks/use-room"
import RoomHeader from "@/components/room-header"
import VotingArea from "@/components/voting-area"
import ParticipantsList from "@/components/participants-list"
import StoryManager from "@/components/story-manager"
import AdminPanel from "@/components/admin-panel"

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.code

  const [userName, setUserName] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [mounted, setMounted] = useState(false)

  const {
    room,
    participantId,
    isLoading,
    error,
    submitVote,
    revealVotes,
    resetVotes,
    addStory,
    deleteStory,
    selectStory,
    setAdminMode,
  } = useRoom(roomCode, userName)

  useEffect(() => {
    setMounted(true)

    const storedName = localStorage.getItem("userName")
    const storedIsAdmin = localStorage.getItem("isAdmin") === "true"

    if (!storedName) {
      router.push("/")
      return
    }

    setUserName(storedName)
    setIsAdmin(storedIsAdmin)
  }, [router])

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Conectando a la sala...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">Error: {error}</p>
          <button onClick={() => router.push("/")} className="text-primary hover:underline">
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <RoomHeader roomCode={roomCode} userName={userName} isAdmin={isAdmin} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <VotingArea
              isAdmin={isAdmin}
              userName={userName}
              room={room}
              participantId={participantId}
              onVote={submitVote}
              onReveal={revealVotes}
              onReset={resetVotes}
            />

            <StoryManager
              room={room}
              isAdmin={isAdmin}
              onAddStory={addStory}
              onDeleteStory={deleteStory}
              onSelectStory={selectStory}
            />
          </div>

          <div className="lg:col-span-1 space-y-6">
            {isAdmin && <AdminPanel room={room} participantId={participantId} onSetAdminMode={setAdminMode} />}

            <ParticipantsList userName={userName} participants={room?.participants || []} />
          </div>
        </div>
      </div>
    </div>
  )
}
