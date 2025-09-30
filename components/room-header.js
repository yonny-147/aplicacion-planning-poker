"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Copy, LogOut, Share2, Check } from "lucide-react"

export default function RoomHeader({ roomCode, userName, isAdmin }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareRoomLink = () => {
    const inviteLink = `${window.location.origin}/join/${roomCode}`
    navigator.clipboard.writeText(inviteLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const leaveRoom = () => {
    localStorage.removeItem("userName")
    localStorage.removeItem("isAdmin")
    localStorage.removeItem("participantId")
    router.push("/")
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-2xl font-bold">Planning Poker</h1>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Sala:</span>
              <span className="font-mono font-bold text-primary">{roomCode}</span>
              <button
                onClick={copyRoomCode}
                className="ml-2 p-1 hover:bg-background rounded transition-colors"
                title="Copiar código"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {isAdmin && (
              <>
                <span className="px-3 py-1 bg-accent/20 text-accent text-sm font-medium rounded-full">
                  Administrador
                </span>
                <Button
                  onClick={shareRoomLink}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Enlace copiado
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartir enlace
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Conectado como: <span className="font-medium text-foreground">{userName}</span>
            </span>
            <Button
              onClick={leaveRoom}
              variant="outline"
              size="sm"
              className="border-border hover:bg-muted bg-transparent"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
