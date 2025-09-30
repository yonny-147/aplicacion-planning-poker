"use client"

import { useEffect, useState } from "react"

export function useRoom(roomCode, userName) {
  const [room, setRoom] = useState(null)
  const [participantId, setParticipantId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!roomCode || !userName) return

    const joinRoom = async () => {
      try {
        let storedParticipantId = localStorage.getItem(`planning-poker-participant-${roomCode}`)

        // Si no existe un ID específico para esta sala, intentar con el ID general
        if (!storedParticipantId) {
          storedParticipantId = localStorage.getItem("participantId")
        }

        const response = await fetch(`/api/rooms/${roomCode}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantName: userName,
            participantId: storedParticipantId, // Enviar el ID al servidor
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

  useEffect(() => {
    if (!roomCode || isLoading) return

    let eventSource = null
    let reconnectTimeout = null

    const connect = () => {
      eventSource = new EventSource(`/api/rooms/${roomCode}/stream`)

      eventSource.onmessage = (event) => {
        const updatedRoom = JSON.parse(event.data)
        setRoom(updatedRoom)
      }

      eventSource.onerror = () => {
        console.error("Error en la conexión SSE, reconectando...")
        eventSource.close()
        // Reconectar después de 2 segundos
        reconnectTimeout = setTimeout(() => {
          connect()
        }, 2000)
      }
    }

    connect()

    return () => {
      if (eventSource) {
        eventSource.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [roomCode, isLoading])

  const submitVote = async (vote) => {
    try {
      const response = await fetch(`/api/rooms/${roomCode}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, vote }),
      })

      if (!response.ok) throw new Error("Error al enviar voto")

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

      const data = await response.json()
      setRoom(data)
    } catch (err) {
      console.error(err)
    }
  }

  return {
    room,
    participantId,
    isLoading,
    error,
    submitVote,
    revealVotes,
    resetVotes,
    addStory,
    deleteStory,
    selectStory,
    setAdminMode,
  }
}
