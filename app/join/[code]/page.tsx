"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Users } from "lucide-react"

export default function JoinRoomPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomCode = params.code

  const [userName, setUserName] = useState(searchParams.get("name") || "")
  const [role, setRole] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [roomExists, setRoomExists] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [error, setError] = useState("")

  useEffect(() => {
    validateRoom()
  }, [roomCode])

  const validateRoom = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomCode}/validate`)
      const data = await response.json()

      if (data.exists) {
        setRoomExists(true)
        setParticipantCount(data.participantCount)
      } else {
        setRoomExists(false)
      }
    } catch (err) {
      setRoomExists(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!userName.trim()) {
      setError("Por favor ingresa tu nombre")
      return
    }
    if (!role) {
      setError("Por favor selecciona tu rol")
      return
    }

    setIsJoining(true)
    setError("")

    try {
      const maxAttempts = 3
      let attempt = 0
      let finalData = null
      let participantId = localStorage.getItem(`planning-poker-participant-${roomCode}`)

      const baseName = userName.trim()

      while (attempt < maxAttempts) {
        if (!participantId) {
          participantId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }

        const response = await fetch(`/api/rooms/${roomCode}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantName: userName.trim(),
            participantId, // Enviar el ID al servidor
            role,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          finalData = data
          break
        }

        // Si el nombre está en uso, intentar una alternativa (solo hasta maxAttempts)
        if (response.status === 409) {
          attempt += 1
          if (attempt >= maxAttempts) {
            setError(data.error || "El nombre ya está en uso. Por favor elige otro nombre.")
            setIsJoining(false)
            return
          }
          // Generar nombre alternativo simple
          const suffix = Math.floor(Math.random() * 900) + 100
          const altName = `${baseName}-${suffix}`
          setUserName(altName)
          // Continuar con el mismo participantId (o regenerarlo?) — mantener para este intento
          continue
        }

        // Otros errores
        setError(data.error || "Error al unirse a la sala")
        setIsJoining(false)
        return
      }

      const data = finalData

  localStorage.setItem("userName", userName.trim())
  localStorage.setItem("isAdmin", "false")
  localStorage.setItem("participantId", data.participantId)
  localStorage.setItem(`planning-poker-participant-${roomCode}`, data.participantId)
  localStorage.setItem(`planning-poker-role-${roomCode}`, role)

      // Redirigir a la sala
      router.push(`/room/${roomCode}`)
    } catch (err) {
      setError("Error de conexión. Por favor intenta de nuevo.")
      setIsJoining(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando sala...</p>
        </div>
      </div>
    )
  }

  if (!roomExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Sala no encontrada</CardTitle>
            </div>
            <CardDescription>La sala con código "{roomCode}" no existe o ha sido cerrada.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full bg-primary hover:bg-primary/90 cursor-pointer">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Unirse a la sala</CardTitle>
          <CardDescription>
            Estás a punto de unirte a la sala de Planning Poker
            <div className="flex items-center gap-2 mt-2 text-foreground">
              <span className="font-mono font-bold text-lg">{roomCode}</span>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1 text-sm">
                <Users className="h-4 w-4" />
                <span>
                  {participantCount} participante{participantCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="userName" className="text-sm font-medium text-foreground">
              Tu nombre
            </label>
            <Input
              id="userName"
              type="text"
              placeholder="Ingresa tu nombre"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="bg-muted border-border text-foreground"
              disabled={isJoining}
              autoFocus
            />
            <div className="mt-4">
              <label className="block mb-2 text-sm font-medium">Selecciona tu rol:</label>
              <div className="flex gap-4">
                <Button variant={role === "QA" ? "default" : "outline"} className="cursor-pointer" onClick={() => setRole("QA")} disabled={isJoining}>
                  QA
                </Button>
                <Button variant={role === "DEV" ? "default" : "outline"} className="cursor-pointer" onClick={() => setRole("DEV")} disabled={isJoining}>
                  DEV
                </Button>
                <Button variant={role === "facilitator" ? "default" : "outline"} className="cursor-pointer" onClick={() => setRole("facilitator")} disabled={isJoining}>
                  Facilitador
                </Button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>

          <Button
            onClick={handleJoin}
            disabled={isJoining || !userName.trim() || !role}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
          >
            {isJoining ? "Uniéndose..." : "Unirse a la sala"}
          </Button>

          <Button onClick={() => router.push("/")} variant="outline" className="w-full cursor-pointer" disabled={isJoining}>
            Cancelar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
