"use client"

import { useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Users } from "lucide-react"

interface ValidateRoomResponse {
  exists: boolean
  participantCount: number
}

interface JoinRoomResponse {
  participantId: string
}

export default function JoinRoomPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomCode = params.code

  const [userName, setUserName] = useState(searchParams.get("name") || "")
  const [role, setRole] = useState("")
  const [error, setError] = useState("")

  const { data: roomData, isLoading } = useQuery<ValidateRoomResponse>({
    queryKey: ["room-validate", roomCode],
    queryFn: async () => {
      const response = await fetch(`/api/rooms/${roomCode}/validate`)
      return response.json()
    },
    staleTime: Infinity,
  })

  const roomExists = roomData?.exists ?? false
  const participantCount = roomData?.participantCount ?? 0

  const joinMutation = useMutation<JoinRoomResponse, Error, { name: string; participantId: string; role: string }>({
    mutationFn: async ({ name, participantId, role }) => {
      const response = await fetch(`/api/rooms/${roomCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName: name,
          participantId,
          role,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        const err = new Error(data.error || "Error al unirse a la sala") as Error & { status: number }
        err.status = response.status
        throw err
      }
      return data
    },
  })

  const handleJoin = async () => {
    if (!userName.trim()) {
      setError("Por favor ingresa tu nombre")
      return
    }
    if (!role) {
      setError("Por favor selecciona tu rol")
      return
    }

    setError("")

    const maxAttempts = 3
    let attempt = 0
    let currentName = userName.trim()
    let participantId =
      localStorage.getItem(`planning-poker-participant-${roomCode}`) ||
      `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    while (attempt < maxAttempts) {
      try {
        const data = await joinMutation.mutateAsync({ name: currentName, participantId, role })

        localStorage.setItem("userName", currentName)
        localStorage.setItem("isAdmin", "false")
        localStorage.setItem("participantId", data.participantId)
        localStorage.setItem(`planning-poker-participant-${roomCode}`, data.participantId)
        localStorage.setItem(`planning-poker-role-${roomCode}`, role)

        router.push(`/room/${roomCode}`)
        return
      } catch (err) {
        const status = (err as Error & { status?: number }).status
        if (status === 409) {
          attempt += 1
          if (attempt >= maxAttempts) {
            setError("El nombre ya está en uso. Por favor elige otro nombre.")
            return
          }
          const suffix = Math.floor(Math.random() * 900) + 100
          currentName = `${userName.trim()}-${suffix}`
          setUserName(currentName)
          participantId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          continue
        }
        setError((err as Error).message || "Error de conexión. Por favor intenta de nuevo.")
        return
      }
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
            <Button onClick={() => router.push("/")} className="w-full bg-primary text-foreground hover:bg-primary/90 cursor-pointer">
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
              disabled={joinMutation.isPending}
              autoFocus
            />
            <div className="mt-4">
              <label className="block mb-2 text-sm font-medium">Selecciona tu rol:</label>
              <div className="flex gap-4">
                <Button variant={role === "QA" ? "default" : "outline"} className="cursor-pointer dark:text-foreground" onClick={() => setRole("QA")} disabled={joinMutation.isPending}>
                  QA
                </Button>
                <Button variant={role === "DEV" ? "default" : "outline"} className="cursor-pointer dark:text-foreground" onClick={() => setRole("DEV")} disabled={joinMutation.isPending}>
                  DEV
                </Button>
                <Button variant={role === "facilitator" ? "default" : "outline"} className="cursor-pointer dark:text-foreground" onClick={() => setRole("facilitator")} disabled={joinMutation.isPending}>
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
            disabled={joinMutation.isPending || !userName.trim() || !role}
            className="w-full bg-primary hover:bg-primary/90 dark:text-foreground text-primary-foreground cursor-pointer"
          >
            {joinMutation.isPending ? "Uniéndose..." : "Unirse a la sala"}
          </Button>

          <Button onClick={() => router.push("/")} variant="outline" className="w-full cursor-pointer" disabled={joinMutation.isPending}>
            Cancelar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
