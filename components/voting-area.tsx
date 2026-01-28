"use client"

import { useState, useEffect, useMemo, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import VotingCard from "@/components/voting-card"
import { RotateCcw, Eye } from "lucide-react"

const FIBONACCI_VALUES = ["0", "1", "2", "3", "4", "5", "8", "13", "?", "coffee"]
const ROLES_FOR_AVERAGE = ["QA", "DEV"]

function VotingArea({ isAdmin, userName, room, participantId, onVote, onReveal, onReset }: { isAdmin: boolean, userName: string, room: any, participantId: string, onVote: (vote: string) => void, onReveal: () => void, onReset: () => void }) {
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  const [adminMode, setAdminMode] = useState("facilitator")

  useEffect(() => {
    if (room && participantId) {
      const participant = Array.isArray(room.participants) ? room.participants.find((p: any) => p.id === participantId) : null
      if (participant) {
        setSelectedVote(participant.vote)
        if (participant.isAdmin) {

          const mode = participant.adminMode || room.adminMode || "facilitator"
          setAdminMode(mode === "open" ? "facilitator" : mode)
        }
      }
    }
  }, [room, participantId])

  const calculateAverageByRole = useMemo(() => {
    if (!room) return null

    const participantsArr = Array.isArray(room.participants) ? room.participants : []

    const roleVotes = participantsArr.reduce((acc: Record<string, number[]>, participant: any) => {
      if (!participant || (participant.isAdmin && participant.adminMode === "facilitator")) {
        return acc
      }

      const normalizedRole = typeof participant.role === "string" ? participant.role.trim().toUpperCase() : ""
      if (normalizedRole === "FACILITATOR") {
        return acc
      }

      const effectiveRole = normalizedRole || (participant.isAdmin && participant.adminMode !== "facilitator" ? "DEV" : "")

      if (!ROLES_FOR_AVERAGE.includes(effectiveRole)) {
        return acc
      }

      const numericValue = Number.parseFloat(participant.vote)
      if (Number.isNaN(numericValue)) {
        return acc
      }

      if (!acc[effectiveRole]) acc[effectiveRole] = []
      acc[effectiveRole].push(numericValue)
      return acc
    }, {})

    const averages: Record<string, string> = {}
    Object.entries(roleVotes).forEach(([role, votes]) => {
      const sum = (votes as number[]).reduce((acc, val) => acc + val, 0)
      averages[role] = (sum / (votes as number[]).length).toFixed(1)
    })

    return Object.keys(averages).length > 0 ? averages : null
  }, [room])

  console.log(calculateAverageByRole)


  const roleAverages = useMemo(() => {
    if (!room?.currentStory) return {}

    const result = room.currentStory.result || {}
    const storyVotes = Array.isArray(room.currentStory.votes) ? room.currentStory.votes : []
    const participantsFallback = Array.isArray(room.participants) ? room.participants : []

    const votesSource = storyVotes.length > 0
      ? storyVotes
      : participantsFallback
        .filter((participant: any) => {
          // Excluir facilitadores
          if (participant?.isAdmin && participant.adminMode === "facilitator") return false
          if (participant?.role && participant.role.toUpperCase() === "FACILITATOR") return false
          return participant?.hasVoted
        })
        .map((participant: any) => {
          // Si el participante es admin en modo participante sin rol, asignar DEV por defecto
          let effectiveRole = participant.role || "";
          if (!effectiveRole && participant.isAdmin && participant.adminMode !== "facilitator") {
            effectiveRole = "DEV";
          }
          return { role: effectiveRole, vote: participant.vote };
        })

    return ROLES_FOR_AVERAGE.reduce((acc: any, role: string) => {
      const backendValue = result?.[role]
      if (backendValue !== undefined && backendValue !== null && backendValue !== "") {
        const normalizedBackend = Number.parseFloat(backendValue)
        acc[role] = Number.isNaN(normalizedBackend) ? backendValue : normalizedBackend.toFixed(1)
        return acc
      }

      const roleVotes = votesSource
        .filter((vote: any) => typeof vote?.role === "string" && vote.role.trim().toUpperCase() === role)
        .map((vote: any) => Number.parseFloat(vote.vote))
        .filter((value: number) => !Number.isNaN(value))

      if (roleVotes.length > 0) {
        const average = roleVotes.reduce((sum: number, value: number) => sum + value, 0) / roleVotes.length
        acc[role] = average.toFixed(1)
      }

      return acc
    }, {})
  }, [room])

  const roleAverageEntries = useMemo(
    () =>
      ROLES_FOR_AVERAGE.map((role) => {
        const value = roleAverages[role]
        return value ? { role, value } : null
      }).filter(Boolean),
    [roleAverages],
  )

  console.log(roleAverages)

  const votingParticipants = useMemo(
    () => {
      const parts = Array.isArray(room?.participants) ? room.participants : []
      return parts.filter((p: any) => {
        // Excluir admins en modo facilitador
        if (p.isAdmin && p.adminMode === "facilitator") return false
        // Excluir participantes con rol FACILITATOR
        if (p.role && p.role.toUpperCase() === "FACILITATOR") return false
        return true
      })
    },
    [room?.participants],
  )

  const allVoted = useMemo(
    () => votingParticipants.length > 0 && votingParticipants.every((p: any) => p.hasVoted),
    [votingParticipants],
  )

  const isRevealed = room?.votesRevealed || false

  // Verificar si el usuario actual es facilitador (admin en modo facilitador o con rol FACILITATOR)
  const isFacilitator = useMemo(() => {
    if (isAdmin && adminMode === "facilitator") return true
    if (room && participantId) {
      const currentParticipant = Array.isArray(room.participants)
        ? room.participants.find((p: any) => p.id === participantId)
        : null
      if (currentParticipant?.role?.toUpperCase() === "FACILITATOR") return true
    }
    return false
  }, [isAdmin, adminMode, room, participantId])


  const currentStory = room?.stories?.find((s: any) => s.id === room?.selectedStoryId) || null


  const handleVote = (value: string) => {
    setSelectedVote(value!)
    onVote(value)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Historia Actual</CardTitle>
          {isAdmin && currentStory && (
            <div className="flex gap-2">
              {allVoted && !isRevealed && (
                <Button
                  onClick={onReveal}
                  size="sm"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium transition-all hover:shadow-md hover:scale-105 cursor-pointer"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Revelar Votos
                </Button>
              )}
              {isRevealed && (
                <Button
                  onClick={onReset}
                  size="sm"
                  variant="outline"
                  className="border-border hover:bg-muted bg-transparent font-medium transition-all hover:shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetear
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!currentStory ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay historia seleccionada</p>
              {isAdmin && (
                <p className="text-sm text-muted-foreground mt-2">Crea una historia para comenzar la votación</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">{currentStory.title}</h3>
                {currentStory.description && (
                  <p className="text-muted-foreground leading-relaxed">{currentStory.description}</p>
                )}
              </div>

              {isRevealed && room && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-3">Resultados de la votación</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {votingParticipants.map((participant: any) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-3 bg-background rounded-lg"
                      >
                        <span className="text-sm font-medium">{participant.name}</span>
                        <span className="text-lg font-bold text-primary">
                          {participant.vote === "coffee" ? "☕" : participant.vote || "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                  {calculateAverageByRole && (
                    <div className="flex  justify-center gap-3">
                      {Object.entries(calculateAverageByRole).map(([role, value]: [string, string]) => (
                        <div
                          key={role}
                          className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border border-border w-full"
                        >
                          <span className="text-sm font-medium text-muted-foreground">Promedio {role}</span>
                          <span className="text-2xl font-bold text-primary">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {currentStory && !isFacilitator && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Selecciona tu estimación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-4">
              {FIBONACCI_VALUES.map((value) => (
                <VotingCard
                  key={value}
                  value={value}
                  isSelected={selectedVote === value}
                  onSelect={handleVote}
                  isRevealed={isRevealed}
                  isDisabled={isRevealed}
                />
              ))}
            </div>

            {selectedVote && !isRevealed && (
              <div className="mt-6 text-center">
                <p className="text-accent font-medium">Tu voto ha sido registrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Esperando a que {allVoted ? "el administrador revele" : "todos voten"}...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentStory && isFacilitator && (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Estás en modo Facilitador</p>
              <p className="text-sm text-muted-foreground mt-2">
                No participas en la votación, solo observas y controlas la sesión
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default memo(VotingArea)
