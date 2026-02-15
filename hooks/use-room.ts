"use client";

import { useEffect, useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
    joinRoom as joinRoomApi,
    voteRoom,
    revealRoom,
    resetRoom,
    addStoryRoom,
    deleteStoryRoom,
    selectStoryRoom,
    setAdminModeRoom,
    changeRoleRoom,
    deleteRoom as deleteRoomApi,
    removeParticipantRoom,
} from "@/lib/api/rooms";

// Type definitions
export interface Participant {
    id: string;
    name: string;
    vote: string | null;
    role: string;
    isAdmin?: boolean;
}

export interface Story {
    id: string;
    title: string;
    description: string;
    selected?: boolean;
    finalVote?: string;
    voted?: boolean;
    result?: {
        QA?: string;
        DEV?: string;
    };
    votes?: Array<{
        participantId: string;
        participantName: string;
        role: string;
        vote: string;
    }>;
    votedAt?: number;
}

export interface Room {
    code: string;
    participants: Participant[];
    votesRevealed: boolean;
    adminMode: string;
    stories?: Story[];
    currentStoryId?: string | null;
}

export interface UseRoomReturn {
    room: Room | null;
    participantId: string | null;
    isLoading: boolean;
    error: string | null;
    wasRemoved: boolean;
    submitVote: (vote: string) => void;
    revealVotes: () => void;
    resetVotes: () => void;
    isVoting: boolean;
    isRevealing: boolean;
    isResetting: boolean;
    addStory: (title: string, description: string) => void;
    deleteStory: (storyId: string) => void;
    selectStory: (storyId: string) => void;
    setAdminMode: (mode: string) => void;
    changeRole: (role: string) => void;
    deleteRoomAndExit: () => Promise<boolean>;
    removeParticipant: (participantIdToRemove: string) => void;
    isAddingStory: boolean;
    isDeletingStory: boolean;
    isSelectingStory: boolean;
    isSettingAdminMode: boolean;
    isChangingRole: boolean;
    isDeletingRoom: boolean;
    isRemovingParticipant: boolean;
}

export function useRoom(
    roomCode: string | string[],
    userName: string,
): UseRoomReturn {
    const [room, setRoom] = useState<Room | null>(null);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wasRemoved, setWasRemoved] = useState(false);

    // Usar ref para mantener la conexión SSE estable entre re-renders
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);
    const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Convert roomCode to string if it's an array
    const code = Array.isArray(roomCode) ? roomCode[0] : roomCode;

    const initialJoinMutation = useMutation({
        mutationFn: async () => {
            let storedParticipantId = localStorage.getItem(
                `planning-poker-participant-${code}`,
            );
            if (!storedParticipantId) {
                storedParticipantId = localStorage.getItem("participantId");
            }
            const storedRole =
                localStorage.getItem(`planning-poker-role-${code}`) || "";
            return joinRoomApi(code, {
                participantName: userName,
                participantId:
                    storedParticipantId ??
                    `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                role: storedRole,
            });
        },
        onSuccess: (data) => {
            setRoom(data.room as Room);
            setParticipantId(data.participantId);
            localStorage.setItem("participantId", data.participantId);
            localStorage.setItem(
                `planning-poker-participant-${code}`,
                data.participantId,
            );
            setIsLoading(false);
        },
        onError: (err) => {
            setError(
                err instanceof Error ? err.message : "Error desconocido",
            );
            setIsLoading(false);
        },
    });

    useEffect(() => {
        if (!code || !userName) return;
        initialJoinMutation.mutate();
    }, [code, userName]);

    // Efecto para establecer conexión SSE - solo se ejecuta UNA VEZ por roomCode
    useEffect(() => {
        if (!code) {
            return;
        }

        // CANCELAR cualquier cleanup diferido pendiente ANTES de decidir saltar por conexión existente
        if (cleanupTimeoutRef.current) {
            clearTimeout(cleanupTimeoutRef.current);
            cleanupTimeoutRef.current = null;
        }

        // Si ya hay una conexión activa para esta sala, no hacer nada
        if (eventSourceRef.current) {
            return;
        }

        isMountedRef.current = true;
        let isConnecting = false;
        let connectionAttempts = 0;

        const connect = () => {
            if (!isMountedRef.current) {
                return;
            }

            if (isConnecting) {
                return;
            }

            connectionAttempts++;
            isConnecting = true;

            // Cerrar conexión anterior si existe
            if (eventSourceRef.current) {
                try {
                    eventSourceRef.current.close();
                } catch (e) {
                    // Ignorar error
                }
            }

            eventSourceRef.current = new EventSource(
                `/api/rooms/${code}/stream`,
            );

            eventSourceRef.current.onopen = () => {
                isConnecting = false;
            };

            eventSourceRef.current.onmessage = (event) => {
                try {
                    const updatedRoom = JSON.parse(event.data) as Room;

                    if (!Array.isArray(updatedRoom.participants)) {
                        updatedRoom.participants = [];
                    }
                    setRoom(updatedRoom);
                } catch (error) {
                    console.error("[SSE] Error parseando datos:", error);
                }
            };

            eventSourceRef.current.onerror = (error) => {
                isConnecting = false;

                if (
                    eventSourceRef.current &&
                    eventSourceRef.current.readyState === 2
                ) {
                    // Conexión cerrada, intentar reconectar
                    eventSourceRef.current.close();
                    eventSourceRef.current = null;
                    if (isMountedRef.current && !reconnectTimeoutRef.current) {
                        reconnectTimeoutRef.current = setTimeout(() => {
                            reconnectTimeoutRef.current = null;
                            connect();
                        }, 3000);
                    }
                }
            };
        };

        connect();

        // Cleanup SOLO cuando roomCode cambia (no en re-renders)
        return () => {
            // Si ya existe un cleanup pendiente, cancelarlo antes de programar otro
            if (cleanupTimeoutRef.current) {
                clearTimeout(cleanupTimeoutRef.current);
                cleanupTimeoutRef.current = null;
            }

            // Programar cierre diferido para sobrevivir al doble-montaje de Strict Mode
            const currentEventSource = eventSourceRef.current;
            cleanupTimeoutRef.current = setTimeout(() => {
                // Si nadie canceló este cierre (reinicialización), proceder
                if (
                    eventSourceRef.current === currentEventSource &&
                    eventSourceRef.current
                ) {
                    isMountedRef.current = false;
                    try {
                        eventSourceRef.current.close();
                    } catch {}
                    eventSourceRef.current = null;
                    if (reconnectTimeoutRef.current) {
                        clearTimeout(reconnectTimeoutRef.current);
                        reconnectTimeoutRef.current = null;
                    }
                }
                cleanupTimeoutRef.current = null;
            }, 800); // 800ms para dar margen amplio a remounts en dev
        };
    }, [code]); // Solo roomCode, mantener conexión estable

    // Efecto para detectar si el participante fue eliminado
    useEffect(() => {
        if (!room || !participantId || isLoading) return;

        const participantExists = room.participants?.some(
            (p) => p.id === participantId,
        );

        if (!participantExists) {
            setWasRemoved(true);
        }
    }, [room, participantId, isLoading]);

    const voteMutation = useMutation({
        mutationFn: (vote: string) => voteRoom(code, participantId!, vote),
        onSuccess: (data) => setRoom(data as Room),
        onError: (err) => console.error("[useRoom] Error al votar:", err),
    });

    const revealMutation = useMutation({
        mutationFn: () => revealRoom(code, participantId!),
        onSuccess: (data) => setRoom(data as Room),
        onError: (err) => console.error("[useRoom] Error al revelar:", err),
    });

    const resetMutation = useMutation({
        mutationFn: () => resetRoom(code, participantId!),
        onSuccess: (data) => setRoom(data as Room),
        onError: (err) => console.error("[useRoom] Error al resetear:", err),
    });

    const submitVote = (vote: string) => {
        if (participantId) voteMutation.mutate(vote);
    };

    const revealVotes = () => {
        if (participantId) revealMutation.mutate();
    };

    const resetVotes = () => {
        if (participantId) resetMutation.mutate();
    };

    const addStoryMutation = useMutation({
        mutationFn: ({ title, description }: { title: string; description: string }) =>
            addStoryRoom(code, participantId!, { title, description }),
        onSuccess: (data) => setRoom(data as Room),
        onError: (err) => console.error("[useRoom] Error al crear historia:", err),
    });

    const deleteStoryMutation = useMutation({
        mutationFn: (storyId: string) => deleteStoryRoom(code, participantId!, storyId),
        onSuccess: (data) => setRoom(data as Room),
        onError: (err) => console.error("[useRoom] Error al eliminar historia:", err),
    });

    const selectStoryMutation = useMutation({
        mutationFn: (storyId: string) => selectStoryRoom(code, participantId!, storyId),
        onSuccess: (data) => setRoom(data as Room),
        onError: (err) => console.error("[useRoom] Error al seleccionar historia:", err),
    });

    const addStory = (title: string, description: string) => {
        if (participantId) addStoryMutation.mutate({ title, description });
    };

    const deleteStory = (storyId: string) => {
        if (participantId) deleteStoryMutation.mutate(storyId);
    };

    const selectStory = (storyId: string) => {
        if (participantId) selectStoryMutation.mutate(storyId);
    };

    const setAdminModeMutation = useMutation({
        mutationFn: (mode: string) => setAdminModeRoom(code, participantId!, mode),
        onSuccess: (data) => setRoom(data as Room),
        onError: (err) => console.error("[useRoom] Error al cambiar modo:", err),
    });

    const changeRoleMutation = useMutation({
        mutationFn: (role: string) => changeRoleRoom(code, participantId!, role),
        onSuccess: (data, role) => {
            setRoom(data.room as Room);
            localStorage.setItem(`planning-poker-role-${code}`, role);
        },
        onError: (err) => console.error("[useRoom] Error al cambiar rol:", err),
    });

    const deleteRoomMutation = useMutation({
        mutationFn: () => deleteRoomApi(code, participantId!),
        onSuccess: () => {
            localStorage.removeItem("participantId");
            localStorage.removeItem(`planning-poker-participant-${code}`);
            localStorage.removeItem(`planning-poker-role-${code}`);
        },
        onError: (err) => console.error("[useRoom] Error al eliminar sala:", err),
    });

    const removeParticipantMutation = useMutation({
        mutationFn: (participantIdToRemove: string) =>
            removeParticipantRoom(code, participantIdToRemove, participantId!),
        onSuccess: (data) => setRoom(data as Room),
        onError: (err) => console.error("[useRoom] Error al eliminar participante:", err),
    });

    const setAdminMode = (mode: string) => {
        if (participantId) setAdminModeMutation.mutate(mode);
    };

    const changeRole = (role: string) => {
        if (participantId) changeRoleMutation.mutate(role);
    };

    const deleteRoomAndExit = (): Promise<boolean> =>
        deleteRoomMutation.mutateAsync().then(() => true);

    const removeParticipant = (participantIdToRemove: string) => {
        if (participantId) removeParticipantMutation.mutate(participantIdToRemove);
    };

    return {
        room,
        participantId,
        isLoading,
        error,
        wasRemoved,
        submitVote,
        revealVotes,
        resetVotes,
        isVoting: voteMutation.isPending,
        isRevealing: revealMutation.isPending,
        isResetting: resetMutation.isPending,
        addStory,
        deleteStory,
        selectStory,
        setAdminMode,
        changeRole,
        deleteRoomAndExit,
        removeParticipant,
        isAddingStory: addStoryMutation.isPending,
        isDeletingStory: deleteStoryMutation.isPending,
        isSelectingStory: selectStoryMutation.isPending,
        isSettingAdminMode: setAdminModeMutation.isPending,
        isChangingRole: changeRoleMutation.isPending,
        isDeletingRoom: deleteRoomMutation.isPending,
        isRemovingParticipant: removeParticipantMutation.isPending,
    };
}
