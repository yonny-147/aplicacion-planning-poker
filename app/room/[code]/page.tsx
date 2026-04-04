"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"

import RoomHeader from "@/components/room-header"
import VotingArea from "@/components/voting-area"
import ParticipantsList from "@/components/participants-list"
import StoryManager from "@/components/story-manager"
import AdminPanel from "@/components/admin-panel"
import { useRoom } from "@/hooks/use-room"
import { toast } from "sonner"
import VotedStoriesHistory from "@/components/voted-stories-history"


export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.code

  const [mounted, setMounted] = useState(false)

  // Leer userName ANTES de cualquier cosa para evitar cambios que causen re-renders
  const userName = useRef(
    typeof window !== 'undefined' ? localStorage.getItem("userName") || "" : ""
  ).current

  const isAdmin = useRef(
    typeof window !== 'undefined' ? localStorage.getItem("isAdmin") === "true" : false
  ).current

  const {
    room,
    participantId,
    isLoading,
    error,
    wasRemoved,
    submitVote,
    revealVotes,
    resetVotes,
    addStory,
    deleteStory,
    selectStory,
    setAdminMode,
    changeRole,
    deleteRoomAndExit,
  } = useRoom(roomCode, userName)

  const removeParticipantMutation = useMutation({
    mutationFn: async (participantIdToRemove: string) => {
      const response = await fetch(
        `/api/rooms/${roomCode}/participants/${participantIdToRemove}/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminId: participantId }),
        }
      )
      if (!response.ok) throw new Error("Error al eliminar participante")
    },
    onError: () => {
      toast.error("No se pudo eliminar al participante")
    },
  })

  const handleRemoveParticipant = (participantIdToRemove: string) => {
    if (!participantIdToRemove || !participantId) return
    removeParticipantMutation.mutate(participantIdToRemove)
  }

  useEffect(() => {
    setMounted(true)

    if (!userName) {
      router.push("/")
      return
    }

    const code = Array.isArray(roomCode) ? roomCode[0] : roomCode
    const hasRoomSession = localStorage.getItem(`planning-poker-participant-${code}`)
    if (!hasRoomSession) {
      router.push(`/join/${code}`)
      return
    }
  }, [router, userName, roomCode])

  useEffect(() => {
    if (wasRemoved) {
      localStorage.removeItem("userName")
      localStorage.removeItem("isAdmin")
      localStorage.removeItem("participantId")
      localStorage.removeItem(`planning-poker-participant-${roomCode}`)
      localStorage.removeItem(`planning-poker-role-${roomCode}`)

      toast.error("Eliminado de la sala", {
        description: "Has sido eliminado de la sala o la sala fue eliminada por el administrador.",
      })

      setTimeout(() => {
        router.push("/")
      }, 1500)
    }
  }, [wasRemoved, router, roomCode, toast])

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
          <button onClick={() => router.push("/")} className="text-primary hover:underline cursor-pointer">
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  // Función para eliminar la sala completa
  const handleDeleteRoom = async () => {
    try {
      await deleteRoomAndExit()

      // Limpiar localStorage
      localStorage.removeItem("userName")
      localStorage.removeItem("isAdmin")


      // Redirigir a la página principal
      router.push("/")
    } catch (err: any) {
      toast.error(err.message || "No se pudo eliminar la sala");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <RoomHeader
        roomCode={roomCode as string}
        userName={userName}
        isAdmin={isAdmin}
        currentRole={room?.participants?.find((p: any) => p.id === participantId)?.role || ""}
        onChangeRole={changeRole}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <ParticipantsList
              userName={userName}
              participants={room?.participants || []}
              isAdmin={isAdmin}
              onRemoveParticipant={handleRemoveParticipant}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <VotingArea
              isAdmin={isAdmin}
              userName={userName}
              room={room}
              participantId={participantId as string}
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

            <VotedStoriesHistory room={room} />
          </div>

          <div className="lg:col-span-1">
            {isAdmin && (
              <AdminPanel
                room={room}
                participantId={participantId as string}
                onSetAdminMode={setAdminMode}
                onDeleteRoom={handleDeleteRoom}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
