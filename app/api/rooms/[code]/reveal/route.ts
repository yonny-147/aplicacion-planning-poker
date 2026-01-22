import db from "@/lib/firebase";

export async function POST(
    request: Request,
    { params }: { params: { code: string } },
) {
    try {
        const { code } = params;
        const { participantId } = await request.json();

        const roomRef = db.ref(`planning-poker/rooms/${code}`);
        const snapshot = await roomRef.once("value");
        const roomData = snapshot.val();

        if (!roomData) {
            return Response.json(
                { error: "La sala no existe" },
                { status: 404 },
            );
        }

        // Verificar que el participante sea admin
        const participant = roomData.participants?.find(
            (p: any) => p.id === participantId,
        );
        if (!participant?.isAdmin) {
            return Response.json(
                { error: "Solo el administrador puede revelar votos" },
                { status: 403 },
            );
        }

        // Revelar votos
        await roomRef.child("votesRevealed").set(true);

        // Obtener datos actualizados
        const updatedSnapshot = await roomRef.once("value");
        return Response.json(updatedSnapshot.val());
    } catch (error) {
        console.error("Error en reveal:", error);
        return Response.json({ error: "Error del servidor" }, { status: 500 });
    }
}
