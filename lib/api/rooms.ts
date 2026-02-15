/**
 * Funciones que encapsulan las llamadas a la API de salas.
 * Útiles para usarlas dentro de useQuery/useMutation y mantener
 * la lógica de fetch en un solo lugar.
 */

export interface ValidateRoomResponse {
  exists: boolean;
  participantCount?: number;
}

export interface CreateRoomResponse {
  roomCode: string;
  participantId: string;
}

export interface JoinRoomResponse {
  room: unknown;
  participantId: string;
}

/** GET: comprobar si la sala existe y obtener número de participantes */
export async function validateRoom(roomCode: string): Promise<ValidateRoomResponse> {
  const res = await fetch(`/api/rooms/${roomCode}/validate`);
  if (!res.ok) throw new Error("Error al validar la sala");
  return res.json();
}

/** POST: crear una nueva sala. Devuelve roomCode y participantId. */
export async function createRoom(adminName: string, adminId: string): Promise<CreateRoomResponse> {
  const res = await fetch("/api/rooms/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminName: adminName.trim(), adminId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al crear la sala");
  return data;
}

/** POST: unirse a una sala. Devuelve room y participantId. */
export async function joinRoom(
  roomCode: string,
  payload: { participantName: string; participantId: string; role: string }
): Promise<JoinRoomResponse> {
  const res = await fetch(`/api/rooms/${roomCode}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || "Error al unirse a la sala") as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Tipo genérico para la sala devuelta por las rutas de votación/reveal/reset */
export type RoomData = unknown;

/** POST: enviar voto. Devuelve la sala actualizada. */
export async function voteRoom(
  roomCode: string,
  participantId: string,
  vote: string
): Promise<RoomData> {
  const res = await fetch(`/api/rooms/${roomCode}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participantId, vote }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al enviar voto");
  return data;
}

/** POST: revelar votos (solo admin). Devuelve la sala actualizada. */
export async function revealRoom(
  roomCode: string,
  participantId: string
): Promise<RoomData> {
  const res = await fetch(`/api/rooms/${roomCode}/reveal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participantId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al revelar votos");
  return data;
}

/** POST: resetear votos (solo admin). Devuelve la sala actualizada. */
export async function resetRoom(
  roomCode: string,
  participantId: string
): Promise<RoomData> {
  const res = await fetch(`/api/rooms/${roomCode}/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participantId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al resetear votos");
  return data;
}

/** POST: crear historia (solo admin). Devuelve la sala actualizada. */
export async function addStoryRoom(
  roomCode: string,
  participantId: string,
  payload: { title: string; description: string }
): Promise<RoomData> {
  const res = await fetch(`/api/rooms/${roomCode}/stories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      participantId,
      title: payload.title.trim(),
      description: payload.description?.trim() ?? "",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al crear historia");
  return data;
}

/** DELETE: eliminar historia (solo admin). Devuelve la sala actualizada. */
export async function deleteStoryRoom(
  roomCode: string,
  participantId: string,
  storyId: string
): Promise<RoomData> {
  const res = await fetch(
    `/api/rooms/${roomCode}/stories/${storyId}?participantId=${participantId}`,
    { method: "DELETE" }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al eliminar historia");
  return data;
}

/** POST: seleccionar historia (solo admin). Devuelve la sala actualizada. */
export async function selectStoryRoom(
  roomCode: string,
  participantId: string,
  storyId: string
): Promise<RoomData> {
  const res = await fetch(`/api/rooms/${roomCode}/stories/${storyId}/select`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participantId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al seleccionar historia");
  return data;
}

/** POST: cambiar modo admin (facilitator/participant). Devuelve la sala actualizada. */
export async function setAdminModeRoom(
  roomCode: string,
  participantId: string,
  mode: string
): Promise<RoomData> {
  const res = await fetch(`/api/rooms/${roomCode}/admin-mode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participantId, mode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al cambiar modo");
  return data;
}

export interface ChangeRoleResponse {
  room: RoomData;
}

/** POST: cambiar rol del participante. Devuelve { room }. */
export async function changeRoleRoom(
  roomCode: string,
  participantId: string,
  role: string
): Promise<ChangeRoleResponse> {
  const res = await fetch(
    `/api/rooms/${roomCode}/participants/${participantId}/role`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al cambiar rol");
  return data;
}

/** DELETE: eliminar la sala (solo admin). Devuelve { success: true }. */
export async function deleteRoom(
  roomCode: string,
  participantId: string
): Promise<{ success: boolean }> {
  const res = await fetch(
    `/api/rooms/${roomCode}/delete?participantId=${participantId}`,
    { method: "DELETE" }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al eliminar la sala");
  return data;
}

/** POST: eliminar un participante de la sala (solo admin). Devuelve la sala actualizada. */
export async function removeParticipantRoom(
  roomCode: string,
  participantIdToRemove: string,
  adminId: string
): Promise<RoomData> {
  const res = await fetch(
    `/api/rooms/${roomCode}/participants/${participantIdToRemove}/delete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al eliminar participante");
  return data;
}
