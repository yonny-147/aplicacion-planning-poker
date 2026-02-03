"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Copy, LogOut, Share2, Check, User } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ModeToggle } from "./mode-toggle"
import { Separator } from "./ui/separator"

export default function RoomHeader({ roomCode, userName, isAdmin, currentRole = "", onChangeRole }: { roomCode: string, userName: string, isAdmin: boolean, currentRole?: string, onChangeRole: (role: string) => void }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  // Normalizar el rol actual a mayúsculas para comparación
  const normalizedRole = currentRole ? currentRole.toUpperCase() : "DEV"

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
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">Plania</span>
              <Separator orientation="vertical" className="!h-4 bg-muted-foreground" />
              <h1 className="text-md font-medium text-muted-foreground">Planning Poker</h1>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Sala:</span>
              <span className="font-mono font-medium text-foreground">{roomCode}</span>
              <button
                onClick={copyRoomCode}
                className="ml-2 p-1 hover:bg-background rounded transition-colors cursor-pointer"
                title="Copiar código"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {isAdmin && (
              <>
                <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full">
                  Administrador
                </span>
                <Button
                  onClick={shareRoomLink}
                  size="sm"
                  className="bg-muted hover:bg-muted/90 text-foreground cursor-pointer"
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

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{userName}</span>
              </span>
            </div>

            {!isAdmin && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rol:</span>
                <Select value={normalizedRole} onValueChange={onChangeRole}>
                  <SelectTrigger className="w-[140px] h-9 bg-background border-border text-foreground">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEV">Desarrollador</SelectItem>
                    <SelectItem value="QA">QA/Tester</SelectItem>
                    <SelectItem value="FACILITATOR">Facilitador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={leaveRoom}
              variant="outline"
              size="sm"
              className="border-border hover:bg-muted bg-transparent cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
