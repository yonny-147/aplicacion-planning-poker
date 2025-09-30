"use client"

import { useState, useEffect, useMemo, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import VotingCard from "@/components/voting-card"
import { RotateCcw, Eye } from "lucide-react"

const FIBONACCI_VALUES = ["0", "1", "2", "3", "5", "8", "13", "21", "?", "coffee"]

function VotingArea({ isAdmin, userName, room, participantId, onVote, onReveal, onReset }) {
  const [selectedVote, setSelectedVote] = useState(null)
  const [adminMode, setAdminMode] = useState("participant")

  useEffect(() => {
    if (room && participantId) {
      const participant = room.participants.find((p) => p.id === participantId)
      if (participant) {
        setSelectedVote(participant.vote)
        if (participant.isAdmin && participant.adminMode) {
          setAdminMode(participant.adminMode)
        }
      }
    }
  }, [room, participantId])

  const calculateAverage = useMemo(() => {
    if (!room) return null

    const numericVotes = room.participants
      .filter((p) => p.vote && !isNaN(p.vote) && !(p.isAdmin && p.adminMode === "facilitator"))
      .map((p) => Number.parseInt(p.vote))

    if (numericVotes.length === 0) return null

    const sum = numericVotes.reduce((acc, val) => acc + val, 0)
    const avg = sum / numericVotes.length
    return avg.toFixed(1)
  }, [room])

  const votingParticipants = useMemo(
    () => room?.participants.filter((p) => !(p.isAdmin && p.adminMode === "facilitator")) || [],
    [room?.participants],
  )

  const allVoted = useMemo(
    () => votingParticipants.length > 0 && votingParticipants.every((p) => p.hasVoted),
    [votingParticipants],
  )

  const isRevealed = room?.isRevealed || false
  const isFacilitator = isAdmin && adminMode === "facilitator"
  const currentStory = room?.currentStory

  const handleVote = (value) => {
    setSelectedVote(value)
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
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium transition-all hover:shadow-md hover:scale-105"
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
                  className="border-border hover:bg-muted bg-transparent font-medium transition-all hover:shadow-sm"
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
                    {votingParticipants.map((participant) => (
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
                  {calculateAverage && (
                    <div className="flex items-center justify-center gap-2 p-4 bg-accent/20 rounded-lg">
                      <span className="text-sm font-medium text-foreground">Promedio:</span>
                      <span className="text-3xl font-bold text-foreground">{calculateAverage}</span>
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
