"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Users, FileText, Eye, UserCheck, LogOut } from "lucide-react"
import { useSocket } from "@/lib/socket-context"

export default function AdminPanel({ room, participantId, onSetAdminMode, onDeleteRoom }) {
  const [adminMode, setAdminMode] = useState("participant")
  const socket = useSocket()

  useEffect(() => {
    if (room && participantId) {
      const admin = Array.isArray(room.participants) ? room.participants.find((p) => p.id === participantId && p.isAdmin) : null
      if (admin && admin.adminMode) {
        setAdminMode(admin.adminMode)
      }
    }
  }, [room, participantId])

  if (!room) return null

  const participantsArr = Array.isArray(room.participants) ? room.participants : []
  const storiesArr = Array.isArray(room.stories) ? room.stories : []

  const totalParticipants = participantsArr.length
  const totalStories = storiesArr.length
  const votedStories = storiesArr.filter((s) => s.voted).length

  const handleModeChange = (mode) => {
    setAdminMode(mode)
    onSetAdminMode(mode)

    // Emitir evento al servidor para actualizar en tiempo real
    if (socket && room) {
      socket.emit("admin:changeMode", {
        roomId: room.id,
        participantId: participantId,
        adminMode: mode,
      })
    }
  }

  return (
    <Card className="bg-card border border-accent/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-accent">
          <Shield className="w-5 h-5" />
          Panel de Administrador
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm mb-3">Modo de Administrador</h4>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => handleModeChange("participant")}
                size="sm"
                variant={adminMode === "participant" ? "default" : "outline"}
                className={
                  adminMode === "participant"
                    ? "cursor-pointer bg-accent hover:bg-accent/90 text-accent-foreground"
                    : "cursor-pointer border-border hover:bg-muted"
                }
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Participante
              </Button>
              <Button
                onClick={() => handleModeChange("facilitator")}
                size="sm"
                variant={adminMode === "facilitator" ? "default" : "outline"}
                className={
                  adminMode === "facilitator"
                    ? "cursor-pointer bg-accent hover:bg-accent/90 text-accent-foreground"
                    : "cursor-pointer border-border hover:bg-muted"
                }
              >
                <Eye className="w-4 h-4 mr-2" />
                Facilitador
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {adminMode === "participant"
                ? "Participas en la votación como miembro del equipo"
                : "Solo observas y controlas la sesión sin votar"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Participantes</span>
              </div>
              <p className="text-2xl font-bold">{totalParticipants}</p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Historias</span>
              </div>
              <p className="text-2xl font-bold">
                {votedStories}/{totalStories}
              </p>
            </div>
          </div>

          <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
            <h4 className="font-semibold text-sm mb-2">Controles de Administrador</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Crear y gestionar historias de usuario</li>
              <li>• Revelar votos cuando todos hayan votado</li>
              <li>• Resetear votación para nueva ronda</li>
              <li>• Cambiar entre historias activas</li>
            </ul>
          </div>

          <Button
            onClick={onDeleteRoom}
            variant="destructive"
            className="w-full cursor-pointer"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar y Eliminar Sala
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
