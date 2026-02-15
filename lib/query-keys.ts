/**
 * Claves de React Query (Query Keys)
 *
 * React Query usa estas claves para:
 * - Identificar cada "query" (petición GET) en la caché
 * - Saber cuándo invalidar o refetch (p. ej. tras una mutación)
 *
 * Formato recomendado: array por niveles, ej. ['rooms', 'validate', roomCode]
 * Así puedes invalidar todas las queries de rooms con queryClient.invalidateQueries({ queryKey: ['rooms'] })
 */
export const queryKeys = {
  /** Validación de una sala: existe y cuántos participantes tiene */
  roomValidate: (roomCode: string) => ["rooms", "validate", roomCode] as const,
} as const;
