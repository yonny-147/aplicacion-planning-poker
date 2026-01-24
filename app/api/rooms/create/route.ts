import db from "@/lib/firebase";
import { generateRoomCode } from "../../../../lib/utils";

export async function POST(request: Request) {
    try {
        const { adminName, adminId } = await request.json();

        if (!adminName?.trim()) {
            return Response.json(
                { error: "El nombre del administrador es requerido" },
                { status: 400 },
            );
        }

        const roomCode = generateRoomCode();

        // Generar ID para el admin si no se proporciona
        const participantId =
            adminId ||
            `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        await db.ref(`planning-poker/rooms/${roomCode}`).set({
            code: roomCode,
            participants: [
                {
                    id: participantId,
                    name: adminName.trim(),
                    isAdmin: true,
                    role: "",
                    vote: null,
                    hasVoted: false,
                },
            ],
            stories: [],
            votesRevealed: false,
            adminMode: "open",
            selectedStoryId: null,
            createdAt: Date.now(),
        });

        return Response.json({
            roomCode,
            participantId,
        });
    } catch (error) {
        console.error("Error creando sala:", error);
        return Response.json(
            { error: "Error del servidor al crear la sala" },
            { status: 500 },
        );
    }
}
