"use client"

import { memo, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Check, Clock, Eye } from "lucide-react"


const ParticipantItem = memo(function ParticipantItem({ participant, isAdmin, onRemove, isRemoving, compact }: { participant: any, isAdmin: boolean, onRemove: (id: string) => void, isRemoving?: boolean, compact?: boolean }) {
  const isFacilitator = (participant.isAdmin && participant.adminMode === "facilitator") ||
    (participant.role && participant.role.toUpperCase() === "FACILITATOR")

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      "DEV": "Dev",
      "QA": "QA",
      "FACILITATOR": "Facilitador"
    }
    return roleLabels[role?.toUpperCase() as keyof typeof roleLabels] || null
  }

  const padding = compact ? "px-2 py-1.5" : "p-3"
  const textSize = compact ? "text-xs" : "text-sm"

  return (
    <div className={`flex items-center justify-between gap-1 rounded-lg bg-muted ${padding}`}>
      <div className="flex items-center gap-1.5 min-w-0">
        <div
          className={`shrink-0 w-1.5 h-1.5 rounded-full ${isFacilitator ? "bg-blue-500" : participant.hasVoted ? "bg-primary" : "bg-muted-foreground"}`}
        />
        <span className={`font-medium truncate ${textSize}`}>
          {participant.name}
          {participant.isAdmin && (
            <span className="ml-1 text-[10px] text-muted-foreground">(Admin)</span>
          )}
          {participant.role && (
            <span className={compact ? "ml-1 text-[10px] text-muted-foreground" : "ml-1 px-1.5 py-0.5 text-[10px] bg-red-400/10 text-red-400 rounded"}>
              {getRoleLabel(participant.role)}
            </span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isFacilitator ? (
          <Eye className="w-3.5 h-3.5 text-blue-500" />
        ) : participant.hasVoted ? (
          <Check className="w-3.5 h-3.5 text-accent" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        )}
        {isAdmin && !participant.isAdmin && onRemove && (
          <button
            className="px-1.5 py-0.5 text-[10px] bg-transparent border border-destructive text-destructive rounded hover:bg-destructive/10 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onRemove(participant.id)}
            disabled={isRemoving}
            title="Eliminar participante"
          >
            {isRemoving ? "..." : "Eliminar"}
          </button>
        )}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.participant.id === nextProps.participant.id &&
    prevProps.participant.name === nextProps.participant.name &&
    prevProps.participant.hasVoted === nextProps.participant.hasVoted &&
    prevProps.participant.role === nextProps.participant.role &&
    prevProps.participant.adminMode === nextProps.participant.adminMode &&
    prevProps.participant.isAdmin === nextProps.participant.isAdmin &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.isRemoving === nextProps.isRemoving &&
    prevProps.compact === nextProps.compact
  )
})
ParticipantItem.displayName = "ParticipantItem"

function ParticipantsList({ userName, participants = [], isAdmin = false, onRemoveParticipant, isRemovingParticipant = false, variant = "default" }: { userName: string, participants: any[], isAdmin: boolean, onRemoveParticipant: (id: string) => void, isRemovingParticipant?: boolean, variant?: "default" | "sidebar" }) {
  // Fuerza re-render cuando cambian profundamente los participantes (aunque no cambie la referencia)
  const [, force] = useState(0)
  const lastSnapshotRef = useRef("")
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const snapshot = JSON.stringify(participants)
        if (snapshot !== lastSnapshotRef.current) {
          lastSnapshotRef.current = snapshot
          force((n) => n + 1)
        }
      } catch {
        // evitar bloquear el intervalo ante errores de serialización
      }
    }, 1000) // ajustar si necesitas más/menos frecuencia
    return () => clearInterval(id)
  }, [participants])

  // Asegurar que participants sea siempre un array y eliminar duplicados
  const participantsArray = Array.isArray(participants) ? participants : [];

  const votingParticipants = participantsArray.filter((p) => {
    // Excluir admins en modo facilitador
    if (p.isAdmin && p.adminMode === "facilitator") return false
    // Excluir participantes con rol FACILITATOR
    if (p.role && p.role.toUpperCase() === "FACILITATOR") return false
    return true
  })

  const votedCount = votingParticipants.filter((p) => p.hasVoted).length
  const isSidebar = variant === "sidebar"

  if (isSidebar) {
    return (
      <Card className="bg-card border-0 rounded-none shadow-none">
        <CardHeader className="py-3 px-4 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            Participantes ({participantsArray.length})
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {votedCount} de {votingParticipants.length} han votado
          </div>
        </CardHeader>
        <CardContent className="py-2 px-3">
          <div className="space-y-1">
            {participantsArray.map((participant) => (
              <ParticipantItem
                key={`${participant.id}-${participant.role}-${participant.hasVoted}-${participant.adminMode}-${participant.isAdmin}`}
                participant={participant}
                isAdmin={isAdmin}
                onRemove={onRemoveParticipant}
                isRemoving={isRemovingParticipant}
                compact
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Participantes ({participantsArray.length})
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {votedCount} de {votingParticipants.length} han votado
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {participantsArray.map((participant) => (
            <ParticipantItem
              key={`${participant.id}-${participant.role}-${participant.hasVoted}-${participant.adminMode}-${participant.isAdmin}`}
              participant={participant}
              isAdmin={isAdmin}
              onRemove={onRemoveParticipant}
              isRemoving={isRemovingParticipant}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default ParticipantsList
