"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Users } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { validateRoom, joinRoom } from "@/lib/api/rooms";

const MAX_JOIN_ATTEMPTS = 3;

export default function JoinRoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = (params.code as string) ?? "";

  const [userName, setUserName] = useState(searchParams.get("name") || "");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  // --- useQuery: validar sala al montar la página ---
  // Se ejecuta automáticamente cuando roomCode está definido.
  // data = resultado de validateRoom(); isLoading / isError / refetch también disponibles.
  const {
    data: validateData,
    isLoading: isValidating,
    isError: isValidateError,
  } = useQuery({
    queryKey: queryKeys.roomValidate(roomCode),
    queryFn: () => validateRoom(roomCode),
    enabled: !!roomCode,
  });

  const roomExists = !!validateData?.exists;
  const participantCount = validateData?.participantCount ?? 0;

  // --- useMutation: unirse a la sala (reintentos si el nombre está en uso, 409) ---
  const joinMutationSimple = useMutation({
    mutationFn: async () => {
      let participantId = localStorage.getItem(`planning-poker-participant-${roomCode}`);
      if (!participantId) {
        participantId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
      const baseName = userName.trim();
      let currentName = baseName;

      for (let attempt = 0; attempt < MAX_JOIN_ATTEMPTS; attempt++) {
        try {
          const data = await joinRoom(roomCode, {
            participantName: currentName,
            participantId,
            role,
          });
          return { ...data, actualName: currentName };
        } catch (err: unknown) {
          const e = err as Error & { status?: number };
          if (e.status === 409 && attempt < MAX_JOIN_ATTEMPTS - 1) {
            const suffix = Math.floor(Math.random() * 900) + 100;
            currentName = `${baseName}-${suffix}`;
            setUserName(currentName);
            continue;
          }
          throw e;
        }
      }
      throw new Error("Error al unirse a la sala");
    },
    onSuccess: (data) => {
      const nameToSave = "actualName" in data && typeof data.actualName === "string" ? data.actualName : userName.trim();
      localStorage.setItem("userName", nameToSave);
      localStorage.setItem("isAdmin", "false");
      localStorage.setItem("participantId", data.participantId);
      localStorage.setItem(`planning-poker-participant-${roomCode}`, data.participantId);
      localStorage.setItem(`planning-poker-role-${roomCode}`, role);
      router.push(`/room/${roomCode}`);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Error al unirse a la sala");
    },
  });

  const handleJoinSubmit = () => {
    if (!userName.trim()) {
      setError("Por favor ingresa tu nombre");
      return;
    }
    if (!role) {
      setError("Por favor selecciona tu rol");
      return;
    }
    setError("");
    joinMutationSimple.mutate();
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando sala...</p>
        </div>
      </div>
    );
  }

  if (isValidateError || !roomExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Sala no encontrada</CardTitle>
            </div>
            <CardDescription>La sala con código &quot;{roomCode}&quot; no existe o ha sido cerrada.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full bg-primary text-foreground hover:bg-primary/90 cursor-pointer">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
              onKeyDown={(e) => e.key === "Enter" && handleJoinSubmit()}
              className="bg-muted border-border text-foreground"
              disabled={joinMutationSimple.isPending}
              autoFocus
            />
            <div className="mt-4">
              <label className="block mb-2 text-sm font-medium">Selecciona tu rol:</label>
              <div className="flex gap-4">
                <Button variant={role === "QA" ? "default" : "outline"} className="cursor-pointer dark:text-foreground" onClick={() => setRole("QA")} disabled={joinMutationSimple.isPending}>
                  QA
                </Button>
                <Button variant={role === "DEV" ? "default" : "outline"} className="cursor-pointer dark:text-foreground" onClick={() => setRole("DEV")} disabled={joinMutationSimple.isPending}>
                  DEV
                </Button>
                <Button variant={role === "facilitator" ? "default" : "outline"} className="cursor-pointer dark:text-foreground" onClick={() => setRole("facilitator")} disabled={joinMutationSimple.isPending}>
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
            onClick={handleJoinSubmit}
            disabled={joinMutationSimple.isPending || !userName.trim() || !role}
            className="w-full bg-primary hover:bg-primary/90 dark:text-foreground text-primary-foreground cursor-pointer"
          >
            {joinMutationSimple.isPending ? "Uniéndose..." : "Unirse a la sala"}
          </Button>

          <Button onClick={() => router.push("/")} variant="outline" className="w-full cursor-pointer" disabled={joinMutationSimple.isPending}>
            Cancelar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}