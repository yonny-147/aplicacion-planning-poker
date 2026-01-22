"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import RoomHeader from "@/components/room-header"
import VotingArea from "@/components/voting-area"
import ParticipantsList from "@/components/participants-list"
import StoryManager from "@/components/story-manager"
import AdminPanel from "@/components/admin-panel"
import { useRoom } from "@/hooks/use-room"
import { toast } from "sonner"


export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.code

  const [mounted, setMounted] = useState(false)

  // Leer userName ANTES de cualquier cosa para evitar cambios que causen re-renders
  const [userName, setUserName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("userName") || ""
    }
    return ""
  })

  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("isAdmin") === "true"
    }
    return false
  })

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

  useEffect(() => {
    setMounted(true)

    // Validar que exista userName, si no redirigir
    if (!userName) {
      router.push("/")
      return
    }
  }, [router, userName])

  // Efecto para detectar cuando el participante fue eliminado
  useEffect(() => {
    if (wasRemoved) {
      // Limpiar localStorage
      localStorage.removeItem("userName")
      localStorage.removeItem("isAdmin")
      localStorage.removeItem("participantId")
      localStorage.removeItem(`planning-poker-participant-${roomCode}`)

      // Mostrar notificación
      toast.error("Eliminado de la sala", {
        description: "Has sido eliminado de la sala por el administrador.",
      })

      // Redirigir a la página principal después de un breve momento
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

  // Función para eliminar participante
  const handleRemoveParticipant = async (participantIdToRemove: string) => {
    if (!participantIdToRemove || !participantId) return
    try {
      await fetch(`/api/rooms/${roomCode}/participants/${participantIdToRemove}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: participantId }),
      })
    } catch (err) {
      // Puedes mostrar un toast de error si lo deseas
    }
  }

  // Función para eliminar la sala completa
  const handleDeleteRoom = async () => {
    if (!confirm("¿Estás seguro de que deseas cerrar y eliminar esta sala? Todos los participantes serán expulsados y no se podrá recuperar.")) {
      return
    }

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
          <div className="lg:col-span-3 space-y-6">
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
          </div>

          <div className="lg:col-span-1 space-y-6">
            {isAdmin && (
              <AdminPanel
                room={room}
                participantId={participantId as string}
                onSetAdminMode={setAdminMode}
                onDeleteRoom={handleDeleteRoom}
              />
            )}

            <ParticipantsList
              userName={userName}
              participants={room?.participants || []}
              isAdmin={isAdmin}
              onRemoveParticipant={handleRemoveParticipant}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
