// Store global para gestionar el estado de las salas en memoria
class RoomStore {
  constructor() {
    this.rooms = new Map()
    this.listeners = new Map() // Para notificar cambios en tiempo real
  }

  // La persistencia se manejará desde el cliente si es necesario
  notifyListeners(roomCode = null) {
    if (roomCode) {
      const callbacks = this.listeners.get(roomCode)
      if (callbacks) {
        const room = this.getRoom(roomCode)
        callbacks.forEach((callback) => callback(room))
      }
    } else {
      // Notificar a todas las salas
      this.listeners.forEach((callbacks, code) => {
        const room = this.getRoom(code)
        callbacks.forEach((callback) => callback(room))
      })
    }
  }

  addListener(roomCode, callback) {
    if (!this.listeners.has(roomCode)) {
      this.listeners.set(roomCode, new Set())
    }
    this.listeners.get(roomCode).add(callback)
  }

  removeListener(roomCode, callback) {
    if (this.listeners.has(roomCode)) {
      this.listeners.get(roomCode).delete(callback)
    }
  }

  createRoom(roomCode, adminName, adminMode = "participant", adminId = null) {
    const participantId = adminId || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    this.rooms.set(roomCode, {
      code: roomCode,
      participants: [
        {
          id: participantId,
          name: adminName,
          isAdmin: true,
          adminMode,
          hasVoted: false,
          vote: null,
        },
      ],
      currentStory: null,
      stories: [],
      isRevealed: false,
      createdAt: Date.now(),
    })
    this.notifyListeners(roomCode)
    return this.rooms.get(roomCode)
  }

  getRoom(roomCode) {
    return this.rooms.get(roomCode)
  }

  addParticipant(roomCode, participantName, participantId = null) {
    const room = this.rooms.get(roomCode)
    if (!room) return null

    const id = participantId || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    const participant = {
      id,
      name: participantName,
      isAdmin: false,
      adminMode: null,
      hasVoted: false,
      vote: null,
    }

    room.participants.push(participant)
    this.notifyListeners(roomCode)
    return participant
  }

  removeParticipant(roomCode, participantId) {
    const room = this.rooms.get(roomCode)
    if (!room) return false

    room.participants = room.participants.filter((p) => p.id !== participantId)
    this.notifyListeners(roomCode)
    return true
  }

  submitVote(roomCode, participantId, vote) {
    const room = this.rooms.get(roomCode)
    if (!room) return false

    const participant = room.participants.find((p) => p.id === participantId)
    if (!participant) return false

    if (participant.isAdmin && participant.adminMode === "facilitator") {
      return false
    }

    participant.vote = vote
    participant.hasVoted = true
    this.notifyListeners(roomCode)
    return true
  }

  revealVotes(roomCode) {
    const room = this.rooms.get(roomCode)
    if (!room) return false

    room.isRevealed = true

    if (room.currentStory) {
      const currentStory = room.stories.find((s) => s.id === room.currentStory.id)
      if (currentStory) {
        currentStory.votes = room.participants
          .filter((p) => p.hasVoted)
          .map((p) => ({
            participantId: p.id,
            participantName: p.name,
            vote: p.vote,
          }))

        // Calcular y guardar resultado
        const numericVotes = currentStory.votes
          .filter((v) => !isNaN(Number.parseFloat(v.vote)))
          .map((v) => Number.parseFloat(v.vote))

        if (numericVotes.length > 0) {
          const average = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length
          currentStory.result = average.toFixed(1)
        }

        currentStory.voted = true
      }
    }

    this.notifyListeners(roomCode)
    return true
  }

  resetVotes(roomCode) {
    const room = this.rooms.get(roomCode)
    if (!room) return false

    room.participants.forEach((p) => {
      p.vote = null
      p.hasVoted = false
    })
    room.isRevealed = false
    this.notifyListeners(roomCode)
    return true
  }

  setAdminMode(roomCode, participantId, mode) {
    const room = this.rooms.get(roomCode)
    if (!room) return false

    const participant = room.participants.find((p) => p.id === participantId && p.isAdmin)
    if (!participant) return false

    participant.adminMode = mode
    // Si cambia a facilitador, remover su voto
    if (mode === "facilitator") {
      participant.vote = null
      participant.hasVoted = false
    }
    this.notifyListeners(roomCode)
    return true
  }

  setCurrentStory(roomCode, storyId) {
    const room = this.rooms.get(roomCode)
    if (!room) return false

    const story = room.stories.find((s) => s.id === storyId)
    if (!story) return false

    if (room.currentStory && room.isRevealed) {
      const currentStory = room.stories.find((s) => s.id === room.currentStory.id)
      if (currentStory) {
        // Guardar votos de participantes
        currentStory.votes = room.participants
          .filter((p) => p.hasVoted)
          .map((p) => ({
            participantId: p.id,
            participantName: p.name,
            vote: p.vote,
          }))

        // Calcular y guardar resultado
        const numericVotes = currentStory.votes
          .filter((v) => !isNaN(Number.parseFloat(v.vote)))
          .map((v) => Number.parseFloat(v.vote))

        if (numericVotes.length > 0) {
          const average = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length
          currentStory.result = average.toFixed(1)
        }

        currentStory.voted = true
      }
    }

    // Cambiar a la nueva historia
    room.currentStory = story

    if (story.voted && story.votes) {
      // Restaurar votos de participantes
      story.votes.forEach((savedVote) => {
        const participant = room.participants.find((p) => p.id === savedVote.participantId)
        if (participant) {
          participant.vote = savedVote.vote
          participant.hasVoted = true
        }
      })
      room.isRevealed = true
    } else {
      // Resetear votos para nueva votación
      room.participants.forEach((p) => {
        p.vote = null
        p.hasVoted = false
      })
      room.isRevealed = false
    }

    this.notifyListeners(roomCode)
    return true
  }

  addStory(roomCode, story) {
    const room = this.rooms.get(roomCode)
    if (!room) return false

    const newStory = {
      id: Date.now().toString(),
      title: story.title,
      description: story.description || "",
      createdAt: Date.now(),
      voted: false,
      result: null,
      votes: [], // Agregar array para almacenar votos
    }

    room.stories.push(newStory)

    if (!room.currentStory) {
      room.currentStory = newStory
    }

    this.notifyListeners(roomCode)
    return newStory
  }

  deleteStory(roomCode, storyId) {
    const room = this.rooms.get(roomCode)
    if (!room) return false

    room.stories = room.stories.filter((s) => s.id !== storyId)

    if (room.currentStory?.id === storyId) {
      room.currentStory = room.stories[0] || null
    }

    this.notifyListeners(roomCode)
    return true
  }

  markStoryVoted(roomCode, storyId, result) {
    const room = this.rooms.get(roomCode)
    if (!room) return false

    const story = room.stories.find((s) => s.id === storyId)
    if (!story) return false

    story.voted = true
    story.result = result
    this.notifyListeners(roomCode)
    return true
  }
}

// Singleton instance
const roomStore = new RoomStore()

export default roomStore
