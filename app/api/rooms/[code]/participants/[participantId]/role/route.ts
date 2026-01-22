import db from "@/lib/firebase";

export async function POST(
    request: Request,
    { params }: { params: { code: string; participantId: string } },
) {
    try {
        const { code, participantId } = params;
        const { role } = await request.json();

        if (!participantId) {
            return Response.json(
                { error: "ID de participante requerido" },
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

        // Verificar que el participante existe
        const participants = roomData.participants || [];
        const participantExists = participants.some(
            (p: any) => p.id === participantId,
        );

        if (!participantExists) {
            return Response.json(
                { error: "Participante no encontrado" },
                { status: 404 },
            );
        }

        // Actualizar rol del participante
        const updatedParticipants = participants.map((p: any) =>
            p.id === participantId ? { ...p, role } : p,
        );

        await roomRef.child("participants").set(updatedParticipants);

        // Obtener datos actualizados
        const updatedSnapshot = await roomRef.once("value");
        return Response.json({ room: updatedSnapshot.val() });
    } catch (error) {
        console.error("Error en change role:", error);
        return Response.json({ error: "Error del servidor" }, { status: 500 });
    }
}
