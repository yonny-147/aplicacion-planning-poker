"use client"

import { useEffect, useState, useRef } from "react"

export function useRoom(roomCode, userName) {
  const [room, setRoom] = useState(null)
  const [participantId, setParticipantId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wasRemoved, setWasRemoved] = useState(false)
  
  // Usar ref para mantener la conexión SSE estable entre re-renders
  const eventSourceRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const isMountedRef = useRef(true)
  const cleanupTimeoutRef = useRef(null)

  useEffect(() => {
    if (!roomCode || !userName) return

    const joinRoom = async () => {
      try {
        let storedParticipantId = localStorage.getItem(`planning-poker-participant-${roomCode}`)

        // Si no existe un ID específico para esta sala, intentar con el ID general
        if (!storedParticipantId) {
          storedParticipantId = localStorage.getItem("participantId")
        }

        // Obtener el rol guardado si existe
        const storedRole = localStorage.getItem(`planning-poker-role-${roomCode}`) || ""

        const response = await fetch(`/api/rooms/${roomCode}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantName: userName,
            participantId: storedParticipantId, // Enviar el ID al servidor
            role: storedRole, // Enviar el rol guardado
          }),
        })

        if (response.status === 409) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Este nombre ya está en uso")
        }

        if (!response.ok) throw new Error("Error al unirse a la sala")

        const data = await response.json()
        setRoom(data.room)
        setParticipantId(data.participantId)

        localStorage.setItem("participantId", data.participantId)
        localStorage.setItem(`planning-poker-participant-${roomCode}`, data.participantId)

        setIsLoading(false)
      } catch (err) {
        setError(err.message)
        setIsLoading(false)
      }
    }

    joinRoom()
  }, [roomCode, userName])

  // Efecto para establecer conexión SSE - solo se ejecuta UNA VEZ por roomCode
  useEffect(() => {
    if (!roomCode) {
      return;
    }

    // CANCELAR cualquier cleanup diferido pendiente ANTES de decidir saltar por conexión existente
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current)
      cleanupTimeoutRef.current = null
    }

    // Si ya hay una conexión activa para esta sala, no hacer nada
    if (eventSourceRef.current) {
      return;
    }

    isMountedRef.current = true
    let isConnecting = false
    let connectionAttempts = 0

    const connect = () => {
      if (!isMountedRef.current) {
        return;
      }

      if (isConnecting) {
        return;
      }

      connectionAttempts++
      isConnecting = true
      
      // Cerrar conexión anterior si existe
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close()
        } catch (e) {
          // Ignorar error
        }
      }

      eventSourceRef.current = new EventSource(`/api/rooms/${roomCode}/stream`)

      eventSourceRef.current.onopen = () => {
        isConnecting = false
      }

      eventSourceRef.current.onmessage = (event) => {
        try {
          const updatedRoom = JSON.parse(event.data)
          
          if (!Array.isArray(updatedRoom.participants)) {
            updatedRoom.participants = [];
          }
          setRoom(updatedRoom)
        } catch (error) {
          console.error('[SSE] Error parseando datos:', error);
        }
      }

      eventSourceRef.current.onerror = (error) => {
        isConnecting = false
        
        if (eventSourceRef.current && eventSourceRef.current.readyState === 2) {
          // Conexión cerrada, intentar reconectar
          eventSourceRef.current.close()
          eventSourceRef.current = null
          if (isMountedRef.current && !reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectTimeoutRef.current = null
              connect()
            }, 3000)
          }
        }
      }
    }

    connect()

    // Cleanup SOLO cuando roomCode cambia (no en re-renders)
    return () => {
      // Si ya existe un cleanup pendiente, cancelarlo antes de programar otro
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current)
        cleanupTimeoutRef.current = null
      }

      // Programar cierre diferido para sobrevivir al doble-montaje de Strict Mode
      const currentEventSource = eventSourceRef.current
      cleanupTimeoutRef.current = setTimeout(() => {
        // Si nadie canceló este cierre (reinicialización), proceder
        if (eventSourceRef.current === currentEventSource && eventSourceRef.current) {
          isMountedRef.current = false
          try { eventSourceRef.current.close() } catch {}
          eventSourceRef.current = null
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
          }
        }
        cleanupTimeoutRef.current = null
      }, 800) // 800ms para dar margen amplio a remounts en dev
    }
  }, [roomCode]) // Solo roomCode, mantener conexión estable

  // Efecto para detectar si el participante fue eliminado
  useEffect(() => {
    if (!room || !participantId || isLoading) return

    const participantExists = room.participants?.some((p) => p.id === participantId)
    
    if (!participantExists) {
      setWasRemoved(true)
    }
  }, [room, participantId, isLoading])

  const submitVote = async (vote) => {
    try {
      const response = await fetch(`/api/rooms/${roomCode}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, vote }),
      })

      if (!response.ok) throw new Error("Error al enviar voto")

      // Actualización optimista - actualizar inmediatamente sin esperar SSE
      const data = await response.json()
      setRoom(data)
    } catch (err) {
      console.error(err)
    }
  }

  const revealVotes = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomCode}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      })

      if (!response.ok) throw new Error("Error al revelar votos")

      // Actualización optimista - actualizar inmediatamente sin esperar SSE
      const data = await response.json()
      setRoom(data)
    } catch (err) {
      console.error(err)
    }
  }

  const resetVotes = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomCode}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      })

      if (!response.ok) throw new Error("Error al resetear votos")

      // Actualización optimista - actualizar inmediatamente sin esperar SSE
      const data = await response.json()
      setRoom(data)
    } catch (err) {
      console.error(err)
    }
  }

  const addStory = async (title, description) => {
    try {
      const response = await fetch(`/api/rooms/${roomCode}/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, participantId }),
      })

      if (!response.ok) throw new Error("Error al crear historia")

      // Actualización optimista - actualizar inmediatamente sin esperar SSE
      const data = await response.json()
      setRoom(data)
    } catch (err) {
      console.error(err)
    }
  }

  const deleteStory = async (storyId) => {
    try {
      const response = await fetch(`/api/rooms/${roomCode}/stories/${storyId}?participantId=${participantId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar historia")

      // Actualización optimista - actualizar inmediatamente sin esperar SSE
      const data = await response.json()
      setRoom(data)
    } catch (err) {
      console.error(err)
    }
  }

  const selectStory = async (storyId) => {
    try {
      const response = await fetch(`/api/rooms/${roomCode}/stories/${storyId}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      })

      if (!response.ok) throw new Error("Error al seleccionar historia")

      // Actualización optimista - actualizar inmediatamente sin esperar SSE
      const data = await response.json()
      setRoom(data)
    } catch (err) {
      console.error(err)
    }
  }

  const setAdminMode = async (mode) => {
    try {
      const response = await fetch(`/api/rooms/${roomCode}/admin-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, mode }),
      })

      if (!response.ok) throw new Error("Error al cambiar modo")

      // Actualización optimista - actualizar inmediatamente sin esperar SSE
      const data = await response.json()
      setRoom(data)
    } catch (err) {
      console.error(err)
    }
  }

  const changeRole = async (role) => {
    try {
      const response = await fetch(`/api/rooms/${roomCode}/participants/${participantId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[useRoom] Error al cambiar rol:', errorData)
        throw new Error(errorData.error || "Error al cambiar rol")
      }

      // Actualización optimista - actualizar inmediatamente sin esperar SSE
      const data = await response.json()
      setRoom(data.room)
      
      // Guardar el rol en localStorage para persistencia
      localStorage.setItem(`planning-poker-role-${roomCode}`, role)
    } catch (err) {
      console.error('[useRoom] Error en changeRole:', err)
      throw err
    }
  }

  const deleteRoomAndExit = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomCode}/delete?participantId=${participantId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[useRoom] Error al eliminar sala:', errorData)
        throw new Error(errorData.error || "Error al eliminar sala")
      }

      // Limpiar localStorage
      localStorage.removeItem("participantId")
      localStorage.removeItem(`planning-poker-participant-${roomCode}`)
      localStorage.removeItem(`planning-poker-role-${roomCode}`)
      
      return true
    } catch (err) {
      console.error('[useRoom] Error en deleteRoomAndExit:', err)
      throw err
    }
  }

  return {
    room,
    participantId,
    isLoading,
    error,
    wasRemoved,
    submitVote,
    revealVotes,
    resetVotes,
    addStory,
    deleteStory,
    selectStory,
    setAdminMode,
    changeRole,
    deleteRoomAndExit,
  }
}
