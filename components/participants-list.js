"use client"

import { useMemo, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Check, Clock, Eye } from "lucide-react"

const ParticipantItem = memo(({ participant }) => {
  const isFacilitator = participant.isAdmin && participant.adminMode === "facilitator"

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
        </span>
      </div>
      {isFacilitator ? (
        <Eye className="w-4 h-4 text-blue-500" />
      ) : participant.hasVoted ? (
        <Check className="w-4 h-4 text-accent" />
      ) : (
        <Clock className="w-4 h-4 text-muted-foreground" />
      )}
    </div>
  )
})

ParticipantItem.displayName = "ParticipantItem"

function ParticipantsList({ userName, participants }) {
  const votingParticipants = useMemo(
    () => participants.filter((p) => !(p.isAdmin && p.adminMode === "facilitator")),
    [participants],
  )

  const votedCount = useMemo(() => votingParticipants.filter((p) => p.hasVoted).length, [votingParticipants])

  return (
    <Card className="bg-card border-border sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Participantes ({participants.length})
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {votedCount} de {votingParticipants.length} han votado
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {participants.map((participant) => (
            <ParticipantItem key={participant.id} participant={participant} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default memo(ParticipantsList)
