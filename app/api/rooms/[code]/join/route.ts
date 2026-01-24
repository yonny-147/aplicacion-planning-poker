import db from "@/lib/firebase";

export async function POST(
    request: Request,
    { params }: { params: { code: string } },
) {
    try {
        const { code } = params;
        const { participantName, participantId, role } = await request.json();

        if (!participantName?.trim()) {
            return Response.json(
                { error: "El nombre es requerido" },
                { status: 400 },
            );
        }

        const roomRef = db.ref(`planning-poker/rooms/${code}`);
        const snapshot = await roomRef.once("value");
        const roomData = snapshot.val();

        if (!roomData) {
            return Response.json(
                { error: "La sala no existe" },
                { status: 404 },
            );
        }

        // Verificar si el nombre ya está en uso (excepto si es el mismo participante reconectándose)
        const participants = roomData.participants || [];
        const existingParticipant = participants.find(
            (p: any) =>
                p.name === participantName.trim() && p.id !== participantId,
        );

        if (existingParticipant) {
            return Response.json(
                { error: "Este nombre ya está en uso en la sala" },
                { status: 409 },
            );
        }

        // Verificar si el participante ya existe (reconexión)
        const existingById = participants.find(
            (p: any) => p.id === participantId,
        );

        let finalParticipantId = participantId;
        let updatedParticipants;

        if (existingById) {
            // Actualizar participante existente
            updatedParticipants = participants.map((p: any) =>
                p.id === participantId
                    ? {
                          ...p,
                          name: participantName.trim(),
                          role: role || p.role || "",
                      }
                    : p,
            );
        } else {
            // Nuevo participante
            if (!finalParticipantId) {
                finalParticipantId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            }

            const newParticipant = {
                id: finalParticipantId,
                name: participantName.trim(),
                isAdmin: false,
                role: role || "",
                vote: null,
                hasVoted: false,
            };

            updatedParticipants = [...participants, newParticipant];
        }

        // Actualizar en Firebase
        await roomRef.child("participants").set(updatedParticipants);

        // Obtener datos actualizados
        const updatedSnapshot = await roomRef.once("value");
        const updatedRoom = updatedSnapshot.val();

        return Response.json({
            participantId: finalParticipantId,
            room: updatedRoom,
        });
    } catch (error) {
        console.error("Error en join:", error);
        return Response.json({ error: "Error del servidor" }, { status: 500 });
    }
}
