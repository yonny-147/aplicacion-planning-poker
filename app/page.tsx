"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ModeToggle } from "@/components/mode-toggle";

export default function HomePage() {
    const router = useRouter();
    const [roomCode, setRoomCode] = useState("");
    const [createUserName, setCreateUserName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const createRoom = async () => {
        if (!createUserName.trim()) {

            toast.error("Por favor ingresa tu nombre");
            return;
        }

        setIsCreating(true);

        try {
            let adminId = localStorage.getItem("adminId");
            if (!adminId) {
                adminId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                localStorage.setItem("adminId", adminId);
            }

            const response = await fetch("/api/rooms/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    adminName: createUserName.trim(),
                    adminId, // Enviar el ID al servidor
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Error al crear la sala");
                setIsCreating(false);
                return;
            }

            // Guardar datos en localStorage
            localStorage.setItem("userName", createUserName.trim());
            localStorage.setItem("isAdmin", "true");
            localStorage.setItem("participantId", data.participantId);
            localStorage.setItem(
                `planning-poker-participant-${data.roomCode}`,
                data.participantId,
            );

            // Redirigir a la sala
            router.push(`/room/${data.roomCode}`);
        } catch (err) {
            toast.error("Error de conexión. Por favor intenta de nuevo.");
            setIsCreating(false);
        }
    };

    const joinRoom = async () => {
        if (!roomCode.trim()) {
            toast.error("Por favor ingresa el código de la sala");
            return;
        }

        try {
            const response = await fetch(
                `/api/rooms/${roomCode.toUpperCase()}/validate`,
            );
            const data = await response.json();

            if (!data.exists) {
                toast.error("La sala no existe o ha sido cerrada");
                return;
            }

            router.push(`/join/${roomCode.toUpperCase()}`);
        } catch (err) {
            toast.error("Error al validar la sala. Por favor intenta de nuevo.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="absolute top-4 right-4 z-50">
                <ModeToggle />
            </div>
            <div className="w-full max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4 text-balance">
                        Planning Poker
                    </h1>
                    <p className="text-xl text-muted-foreground text-balance">
                        Estimación ágil en tiempo real para tu equipo
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-card border-border">
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
                                    className="bg-muted border-border text-foreground w-full"
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && createRoom()
                                    }
                                />
                            </div>
                            <Button
                                onClick={createRoom}
                                disabled={isCreating}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all hover:shadow-md cursor-pointer"
                            >
                                {isCreating ? "Creando..." : "Crear Sala"}
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
                                    className="bg-muted border-border text-foreground w-full"
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && joinRoom()
                                    }
                                />
                            </div>
                            <Button
                                onClick={joinRoom}
                                variant="outline"
                                className="w-full border-border hover:bg-muted bg-transparent font-medium transition-all hover:shadow-md cursor-pointer"
                            >
                                Unirse a Sala
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
