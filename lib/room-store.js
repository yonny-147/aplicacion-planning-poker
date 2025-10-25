import redis, { REDIS_PREFIX } from "./redis"

// Tiempo de vida de las salas en segundos (por defecto 24 horas)
const ROOM_TTL = process.env.ROOM_TTL ? parseInt(process.env.ROOM_TTL, 10) : 86400

// Store global para gestionar el estado de las salas en Redis
class RoomStore {
  constructor() {
    this.listeners = new Map(); // Para notificar cambios en tiempo real
  }

  // Método auxiliar para calcular votos por rol de manera segura
  _calculateVotesByRole(votes, role) {
    if (!Array.isArray(votes)) return [];
    return votes
      .filter((v) => v && v.role === role && !isNaN(Number.parseFloat(v.vote)))
      .map((v) => Number.parseFloat(v.vote));
  }

  // Método auxiliar para obtener la clave de Redis para una sala
  _getRedisKey(roomCode) {
    return `${REDIS_PREFIX}room:${roomCode}`;
  }

  // Método auxiliar para guardar sala y actualizar TTL
  async _saveRoom(roomCode, room) {
    const key = this._getRedisKey(roomCode);
    await redis.set(key, JSON.stringify(room));
    await redis.expire(key, ROOM_TTL);
    console.log(`[RoomStore] Sala ${roomCode} guardada con TTL de ${ROOM_TTL} segundos`);
  }

  // Notificar a los listeners sobre cambios en las salas
  async notifyListeners(roomCode = null) {
    if (roomCode) {
      const callbacks = this.listeners.get(roomCode);
      console.log(`[RoomStore] Notificando cambios en sala ${roomCode}. Listeners: ${callbacks?.size || 0}`);
      if (callbacks) {
        const room = await this.getRoom(roomCode);
        console.log(`[RoomStore] Estado de la sala:`, { 
          participantes: room?.participants?.length || 0, 
          historias: room?.stories?.length || 0 
        });
        // Notificar a callbacks locales (mismo proceso)
        callbacks.forEach((callback) => {
          console.log(`[RoomStore] Ejecutando callback para sala ${roomCode}`);
          callback(room);
        });
      }
      // Publicar evento por Pub/Sub para todos los procesos/instancias
      try {
        const room = await this.getRoom(roomCode);
        await redis.publish(`${REDIS_PREFIX}room-updates:${roomCode}`, JSON.stringify(room));
        console.log(`[RoomStore] Publicación Redis enviada para sala ${roomCode}`)
      } catch (e) {
        console.error(`[RoomStore] Error publicando actualización Redis para sala ${roomCode}:`, e)
      }
    } else {
      // Notificar a todas las salas
      const keys = await redis.keys(`${REDIS_PREFIX}room:*`);
      for (const key of keys) {
        const code = key.replace(`${REDIS_PREFIX}room:`, '');
        const callbacks = this.listeners.get(code);
        if (callbacks) {
          const room = await this.getRoom(code);
          callbacks.forEach((callback) => callback(room));
        }
        try {
          const room = await this.getRoom(code);
          await redis.publish(`${REDIS_PREFIX}room-updates:${code}`, JSON.stringify(room));
        } catch {}
      }
    }
  }

  addListener(roomCode, callback) {
    if (!this.listeners.has(roomCode)) {
      this.listeners.set(roomCode, new Set());
    }
    this.listeners.get(roomCode).add(callback);
    console.log(`[RoomStore] Listener agregado para sala ${roomCode}. Total: ${this.listeners.get(roomCode).size}`);
  }

  removeListener(roomCode, callback) {
    if (this.listeners.has(roomCode)) {
      this.listeners.get(roomCode).delete(callback);
      console.log(`[RoomStore] Listener removido para sala ${roomCode}. Total: ${this.listeners.get(roomCode).size}`);
    }
  }

  async getRoom(roomCode) {
    try {
      const roomData = await redis.get(this._getRedisKey(roomCode));
      return roomData ? JSON.parse(roomData) : null;
    } catch (err) {
      console.error(`Error obteniendo sala ${roomCode}:`, err);
      return null;
    }
  }

  async createRoom(roomCode, adminName, adminMode = "participant", adminId = null) {
    try {
      console.log(`Creando sala ${roomCode} con admin ${adminName}`);
      const participantId = adminId || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const room = {
        code: roomCode,
        participants: [
          {
            id: participantId,
            name: adminName,
            isAdmin: true,
            adminMode,
            hasVoted: false,
            vote: null,
            role: "",
          },
        ],
        currentStory: null,
        stories: [],
        isRevealed: false,
        createdAt: Date.now(),
      };

      const key = this._getRedisKey(roomCode);
      console.log(`Guardando sala en Redis con clave: ${key}`);
      await this._saveRoom(roomCode, room);
      console.log('Sala guardada en Redis');
      await this.notifyListeners(roomCode);
      return room;
    } catch (error) {
      console.error("Error creating room:", error);
      return null;
    }
  }

  async addParticipant(roomCode, participantName, participantId = null, role = "") {
    try {
      console.log(`[addParticipant] Intentando agregar participante a sala ${roomCode}`);
      const room = await this.getRoom(roomCode);
      if (!room) {
        console.error(`[addParticipant] Sala ${roomCode} no encontrada`);
        return null;
      }

      console.log(`[addParticipant] Estado actual de la sala:`, JSON.stringify(room, null, 2));
      
      // Asegurar que participants es un array
      if (!Array.isArray(room.participants)) {
        console.warn(`[addParticipant] room.participants no es un array, inicializando...`);
        room.participants = [];
      }

      const id = participantId || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const participant = {
        id,
        name: participantName,
        isAdmin: false,
        adminMode: null,
        hasVoted: false,
        vote: null,
        role: role || "",
      };

      room.participants.push(participant);
      console.log(`[addParticipant] Nuevo participante agregado:`, participant);
      console.log(`[addParticipant] Total participantes: ${room.participants.length}`);

      const key = this._getRedisKey(roomCode);
      await redis.set(key, JSON.stringify(room));
      await this.notifyListeners(roomCode);
      return participant;
    } catch (error) {
      console.error("Error adding participant:", error);
      return null;
    }
  }

  async removeParticipant(roomCode, participantId) {
    try {
      const room = await this.getRoom(roomCode);
      if (!room || !Array.isArray(room.participants)) return false;

      // Filtrar el participante a eliminar
      room.participants = room.participants.filter((p) => p.id !== participantId);

      await this._saveRoom(roomCode, room);
      await this.notifyListeners(roomCode);
      return true;
    } catch (error) {
      console.error("Error removing participant:", error);
      return false;
    }
  }

  async updateParticipantRole(roomCode, participantId, role) {
    try {
      console.log(`[updateParticipantRole] Actualizando rol de participante ${participantId} en sala ${roomCode} a ${role}`);
      const room = await this.getRoom(roomCode);
      if (!room || !Array.isArray(room.participants)) {
        console.error(`[updateParticipantRole] Sala ${roomCode} no encontrada o sin participantes`);
        return false;
      }

      const participant = room.participants.find((p) => p.id === participantId);
      if (!participant) {
        console.error(`[updateParticipantRole] Participante ${participantId} no encontrado`);
        return false;
      }

      participant.role = role;
      
      // Si el nuevo rol es FACILITATOR, resetear el voto (los facilitadores no pueden votar)
      if (role && role.toUpperCase() === "FACILITATOR") {
        participant.vote = null;
        participant.hasVoted = false;
        console.log(`[updateParticipantRole] Voto reseteado para ${participant.name} (ahora es facilitador)`);
      }
      
      console.log(`[updateParticipantRole] Rol actualizado para ${participant.name}: ${role}`);

      await this._saveRoom(roomCode, room);
      await this.notifyListeners(roomCode);
      return true;
    } catch (error) {
      console.error("Error updating participant role:", error);
      return false;
    }
  }

  async addStory(roomCode, storyData) {
    try {
      console.log(`[addStory] Intentando agregar historia a sala ${roomCode}`);
      const room = await this.getRoom(roomCode);
      if (!room) {
        console.error(`[addStory] Sala ${roomCode} no encontrada`);
        return null;
      }

      // Asegurar que stories es un array
      if (!Array.isArray(room.stories)) {
        console.warn(`[addStory] room.stories no es un array, inicializando...`);
        room.stories = [];
      }

      const story = {
        id: `story-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: storyData.title,
        description: storyData.description || "",
        createdAt: new Date().toISOString(),
        votes: [],
        voted: false,
        result: {},
      };

      room.stories.push(story);
      console.log(`[addStory] Nueva historia agregada:`, story);
      console.log(`[addStory] Total historias: ${room.stories.length}`);

      await this._saveRoom(roomCode, room);
      await this.notifyListeners(roomCode);
      return story;
    } catch (error) {
      console.error("Error adding story:", error);
      return null;
    }
  }

  async setCurrentStory(roomCode, storyId) {
    try {
      console.log(`[setCurrentStory] Intentando establecer historia ${storyId} en sala ${roomCode}`);
      const room = await this.getRoom(roomCode);
      if (!room) {
        console.error(`[setCurrentStory] Sala ${roomCode} no encontrada`);
        return false;
      }

      // Asegurar que stories es un array
      if (!Array.isArray(room.stories)) {
        console.warn(`[setCurrentStory] room.stories no es un array`);
        return false;
      }

      const story = room.stories.find((s) => s.id === storyId);
      if (!story) {
        console.error(`[setCurrentStory] Historia ${storyId} no encontrada`);
        return false;
      }

      // Resetear votos de los participantes
      if (Array.isArray(room.participants)) {
        room.participants.forEach((p) => {
          p.hasVoted = false;
          p.vote = null;
        });
      }

      room.currentStory = story;
      room.isRevealed = false;

      console.log(`[setCurrentStory] Historia establecida:`, story);

      await this._saveRoom(roomCode, room);
      await this.notifyListeners(roomCode);
      return true;
    } catch (error) {
      console.error("Error setting current story:", error);
      return false;
    }
  }

  async deleteStory(roomCode, storyId) {
    try {
      const room = await this.getRoom(roomCode);
      if (!room || !Array.isArray(room.stories)) return false;

      room.stories = room.stories.filter((s) => s.id !== storyId);

      // Si la historia eliminada era la actual, limpiar currentStory
      if (room.currentStory && room.currentStory.id === storyId) {
        room.currentStory = null;
        room.isRevealed = false;
      }

      await this._saveRoom(roomCode, room);
      await this.notifyListeners(roomCode);
      return true;
    } catch (error) {
      console.error("Error deleting story:", error);
      return false;
    }
  }

  async updateStory(roomCode, storyId, updates) {
    try {
      const room = await this.getRoom(roomCode);
      if (!room || !Array.isArray(room.stories)) return false;

      const story = room.stories.find((s) => s.id === storyId);
      if (!story) return false;

      if (updates.title !== undefined) story.title = updates.title;
      if (updates.description !== undefined) story.description = updates.description;

      await this._saveRoom(roomCode, room);
      await this.notifyListeners(roomCode);
      return story;
    } catch (error) {
      console.error("Error updating story:", error);
      return null;
    }
  }

  async setAdminMode(roomCode, participantId, mode) {
    try {
      const room = await this.getRoom(roomCode);
      if (!room) return false;

      const participant = room.participants.find((p) => p.id === participantId && p.isAdmin);
      if (!participant) return false;

      participant.adminMode = mode;
      if (mode === "facilitator") {
        participant.vote = null;
        participant.hasVoted = false;
      }

      await this._saveRoom(roomCode, room);
      await this.notifyListeners(roomCode);
      return true;
    } catch (error) {
      console.error("Error setting admin mode:", error);
      return false;
    }
  }

  async submitVote(roomCode, participantId, vote, role = null) {
    try {
      const room = await this.getRoom(roomCode);
      if (!room || !room.participants) return false;

      const participant = room.participants.find((p) => p.id === participantId);
      if (!participant) return false;

      // Rechazar votos de facilitadores (admins en modo facilitador o con rol FACILITATOR)
      if (participant.isAdmin && participant.adminMode === "facilitator") {
        console.log(`[submitVote] Voto rechazado: ${participant.name} es admin en modo facilitador`);
        return false;
      }
      
      if (participant.role && participant.role.toUpperCase() === "FACILITATOR") {
        console.log(`[submitVote] Voto rechazado: ${participant.name} tiene rol FACILITATOR`);
        return false;
      }

      participant.vote = vote;
      participant.hasVoted = true;
      if (role) {
        participant.role = role;
      }

      await this._saveRoom(roomCode, room);
      await this.notifyListeners(roomCode);
      return true;
    } catch (error) {
      console.error("Error submitting vote:", error);
      return false;
    }
  }

  async revealVotes(roomCode) {
    try {
      const room = await this.getRoom(roomCode);
      if (!room || !Array.isArray(room.participants) || !Array.isArray(room.stories)) return false;

      room.isRevealed = true;

      if (room.currentStory) {
        const currentStory = room.stories.find((s) => s.id === room.currentStory.id);
        if (currentStory) {
          // Asegurarnos de que participants es un array antes de usarlo
          const participants = Array.isArray(room.participants) ? room.participants : [];

          // Crear el array de votos de manera segura, excluyendo facilitadores
          currentStory.votes = participants
            .filter((p) => {
              if (!p || !p.hasVoted) return false
              // Excluir admins en modo facilitador
              if (p.isAdmin && p.adminMode === "facilitator") return false
              // Excluir participantes con rol FACILITATOR
              if (p.role && p.role.toUpperCase() === "FACILITATOR") return false
              return true
            })
            .map((p) => {
              // Si el participante es admin en modo participante sin rol, asignar DEV por defecto
              let effectiveRole = p.role || "";
              if (!effectiveRole && p.isAdmin && p.adminMode !== "facilitator") {
                effectiveRole = "DEV";
              }
              return {
                participantId: p.id,
                participantName: p.name,
                vote: p.vote,
                role: effectiveRole,
              };
            });

          // Calcular votos por rol de manera segura usando la función auxiliar
          const votesQA = this._calculateVotesByRole(currentStory.votes, "QA");
          const votesDEV = this._calculateVotesByRole(currentStory.votes, "DEV");

          currentStory.result = {};

          if (votesQA.length > 0) {
            const avgQA = votesQA.reduce((a, b) => a + b, 0) / votesQA.length;
            currentStory.result.QA = avgQA.toFixed(1);
          }

          if (votesDEV.length > 0) {
            const avgDEV = votesDEV.reduce((a, b) => a + b, 0) / votesDEV.length;
            currentStory.result.DEV = avgDEV.toFixed(1);
          }

          currentStory.voted = true;
        }
      }

      await this._saveRoom(roomCode, room);
      await this.notifyListeners(roomCode);
      return true;
    } catch (error) {
      console.error("Error revealing votes:", error);
      return false;
    }
  }

  async resetVotes(roomCode) {
    try {
      const room = await this.getRoom(roomCode)
      if (!room) return false

      // Reset de flags de participantes
      if (Array.isArray(room.participants)) {
        room.participants.forEach((p) => {
          p.hasVoted = false
          p.vote = null
        })
      }

      // Reset de historia actual y resultados visibles
      room.isRevealed = false
      if (room.currentStory) {
        const current = Array.isArray(room.stories)
          ? room.stories.find((s) => s.id === room.currentStory.id)
          : null
        if (current) {
          current.votes = []
          current.voted = false
          current.result = {}
        }
      }

      await this._saveRoom(roomCode, room)
      await this.notifyListeners(roomCode)
      return true
    } catch (error) {
      console.error('Error resetting votes:', error)
      return false
    }
  }

  async deleteRoom(roomCode) {
    try {
      console.log(`[deleteRoom] Eliminando sala ${roomCode}`);
      const key = this._getRedisKey(roomCode);
      const deleted = await redis.del(key);
      
      if (deleted) {
        console.log(`[deleteRoom] Sala ${roomCode} eliminada exitosamente`);
        // Notificar a los listeners que la sala fue eliminada
        await this.notifyListeners(roomCode);
        // Limpiar listeners de esta sala
        this.listeners.delete(roomCode);
        return true;
      }
      
      console.warn(`[deleteRoom] Sala ${roomCode} no encontrada`);
      return false;
    } catch (error) {
      console.error("Error deleting room:", error);
      return false;
    }
  }
}

// Singleton robusto incluso en desarrollo con HMR/Hot Reload
const globalKey = '__planning_poker_room_store__'
const roomStore = globalThis[globalKey] || new RoomStore()
if (process.env.NODE_ENV !== 'production') {
  globalThis[globalKey] = roomStore
}

export default roomStore;