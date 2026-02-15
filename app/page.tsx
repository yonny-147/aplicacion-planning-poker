"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { HomerHeader } from "@/components/layout/home-header";
import { createRoom as apiCreateRoom, validateRoom } from "@/lib/api/rooms";

export default function HomePage() {
    const router = useRouter();
    const [roomCode, setRoomCode] = useState("");
    const [createUserName, setCreateUserName] = useState("");

    // --- useMutation: "Crear sala" ---
    // mutate() ejecuta la petición; isLoading/error vienen automáticamente.
    const createRoomMutation = useMutation({
        mutationFn: async () => {
            let adminId = localStorage.getItem("adminId");
            if (!adminId) {
                adminId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                localStorage.setItem("adminId", adminId);
            }
            return apiCreateRoom(createUserName.trim(), adminId);
        },
        onSuccess: (data) => {
            localStorage.setItem("userName", createUserName.trim());
            localStorage.setItem("isAdmin", "true");
            localStorage.setItem("participantId", data.participantId);
            localStorage.setItem(
                `planning-poker-participant-${data.roomCode}`,
                data.participantId,
            );
            router.push(`/room/${data.roomCode}`);
        },
        onError: (err) => {
            toast.error(err instanceof Error ? err.message : "Error al crear la sala");
        },
    });

    // --- useMutation: "Validar sala y redirigir a /join" ---
    const validateAndGoToJoinMutation = useMutation({
        mutationFn: () => validateRoom(roomCode.toUpperCase()),
        onSuccess: (data) => {
            if (data.exists) {
                router.push(`/join/${roomCode.toUpperCase()}`);
            } else {
                toast.error("La sala no existe o ha sido cerrada");
            }
        },
        onError: () => {
            toast.error("Error al validar la sala. Por favor intenta de nuevo.");
        },
    });

    const handleCreateRoom = () => {
        if (!createUserName.trim()) {
            toast.error("Por favor ingresa tu nombre");
            return;
        }
        createRoomMutation.mutate();
    };

    const handleJoinRoom = () => {
        if (!roomCode.trim()) {
            toast.error("Por favor ingresa el código de la sala");
            return;
        }
        validateAndGoToJoinMutation.mutate();
    };

    return (
        <section>
            <HomerHeader />
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-background">
                <div className="w-full max-w-4xl">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold mb-4 text-balance">
                            Planning Poker
                        </h1>
                        <p className="text-xl text-muted-foreground text-balance">
                            Estimación ágil en tiempo real para tu equipo
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="bg-card">
                            <CardHeader>
                                <CardTitle className="text-2xl">
                                    Crear Sala
                                </CardTitle>
                                <CardDescription>
                                    Inicia una nueva sesión de Planning Poker
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="create-name"
                                        className="text-sm font-medium mb-2 block"
                                    >
                                        Tu nombre
                                    </label>
                                    <Input
                                        id="create-name"
                                        type="text"
                                        placeholder="Ingresa tu nombre"
                                        value={createUserName}
                                        onChange={(e) =>
                                            setCreateUserName(e.target.value)
                                        }
                                        className="bg-muted border-border text-foreground w-full shadow-none"
                                        onKeyDown={(e) =>
                                            e.key === "Enter" && handleCreateRoom()
                                        }
                                    />
                                </div>
                                <Button
                                    onClick={handleCreateRoom}
                                    disabled={createRoomMutation.isPending}
                                    className="w-full bg-primary hover:bg-primary/90 dark:text-foreground text-primary-foreground font-medium transition-all cursor-pointer hover:shadow-sm hover:shadow-brand"
                                >
                                    {createRoomMutation.isPending ? "Creando..." : "Crear Sala"}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-2xl">
                                    Unirse a Sala
                                </CardTitle>
                                <CardDescription>
                                    Únete a una sesión existente con un código
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="room-code"
                                        className="text-sm font-medium mb-2 block"
                                    >
                                        Código de sala
                                    </label>
                                    <Input
                                        id="room-code"
                                        type="text"
                                        placeholder="Ej: ABC123"
                                        value={roomCode}
                                        onChange={(e) =>
                                            setRoomCode(
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        className="bg-muted border-border text-foreground w-full shadow-none"
                                        onKeyDown={(e) =>
                                            e.key === "Enter" && handleJoinRoom()
                                        }
                                    />
                                </div>
                                <Button
                                    onClick={handleJoinRoom}
                                    disabled={validateAndGoToJoinMutation.isPending}
                                    variant="outline"
                                    className="w-full border-border hover:bg-muted bg-background font-medium transition-all cursor-pointer shadow-none"
                                >
                                    {validateAndGoToJoinMutation.isPending ? "Comprobando..." : "Unirse a Sala"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
}