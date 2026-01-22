import db from "@/lib/firebase";

export async function POST(
    request: Request,
    { params }: { params: { code: string } },
) {
    try {
        const { code } = params;
        const { participantId, vote } = await request.json();

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

        // Actualizar el voto del participante
        const participants = roomData.participants || [];
        const updatedParticipants = participants.map((p: any) =>
            p.id === participantId ? { ...p, vote } : p,
        );

        await roomRef.child("participants").set(updatedParticipants);

        // Obtener datos actualizados
        const updatedSnapshot = await roomRef.once("value");
        return Response.json(updatedSnapshot.val());
    } catch (error) {
        console.error("Error en vote:", error);
        return Response.json({ error: "Error del servidor" }, { status: 500 });
    }
}
