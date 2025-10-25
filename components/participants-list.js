"use client"

import { useMemo, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Check, Clock, Eye } from "lucide-react"


const ParticipantItem = memo(function ParticipantItem({ participant, isAdmin, onRemove }) {
  const isFacilitator = (participant.isAdmin && participant.adminMode === "facilitator") || 
                        (participant.role && participant.role.toUpperCase() === "FACILITATOR")
  
  const getRoleLabel = (role) => {
    const roleLabels = {
      "DEV": "Dev",
      "QA": "QA",
      "FACILITATOR": "Facilitador"
    }
    return roleLabels[role?.toUpperCase()] || null
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isFacilitator ? "bg-blue-500" : participant.hasVoted ? "bg-accent" : "bg-muted-foreground"
          }`}
        />
        <span className="text-sm font-medium">
          {participant.name}
          {participant.isAdmin && (
            <span className="ml-2 text-xs text-muted-foreground">({isFacilitator ? "Facilitador" : "Admin"})</span>
          )}
          {participant.role && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
              {getRoleLabel(participant.role)}
            </span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {isFacilitator ? (
          <Eye className="w-4 h-4 text-blue-500" />
        ) : participant.hasVoted ? (
          <Check className="w-4 h-4 text-accent" />
        ) : (
          <Clock className="w-4 h-4 text-muted-foreground" />
        )}
        {isAdmin && !participant.isAdmin && onRemove && (
          <button
            className="ml-2 px-2 py-1 text-xs bg-destructive text-white rounded hover:bg-destructive/80 cursor-pointer transition-all"
            onClick={() => onRemove(participant.id)}
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  )
})
ParticipantItem.displayName = "ParticipantItem"

function ParticipantsList({ userName, participants = [], isAdmin = false, onRemoveParticipant }) {
  // Asegurar que participants sea siempre un array y eliminar duplicados
  const participantsArray = useMemo(() => {
    if (!Array.isArray(participants)) return [];
    
    // Eliminar duplicados basándose en el ID
    const uniqueParticipants = [];
    const seenIds = new Set();
    
    for (const participant of participants) {
      if (participant && participant.id && !seenIds.has(participant.id)) {
        seenIds.add(participant.id);
        uniqueParticipants.push(participant);
      }
    }
    
    return uniqueParticipants;
  }, [participants]);
  
  const votingParticipants = useMemo(
    () => participantsArray.filter((p) => {
      // Excluir admins en modo facilitador
      if (p.isAdmin && p.adminMode === "facilitator") return false
      // Excluir participantes con rol FACILITATOR
      if (p.role && p.role.toUpperCase() === "FACILITATOR") return false
      return true
    }),
    [participantsArray],
  )

  const votedCount = useMemo(() => votingParticipants.filter((p) => p.hasVoted).length, [votingParticipants])

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
              key={participant.id}
              participant={participant}
              isAdmin={isAdmin}
              onRemove={onRemoveParticipant}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default memo(ParticipantsList)
