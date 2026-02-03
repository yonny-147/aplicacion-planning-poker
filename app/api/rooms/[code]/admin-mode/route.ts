import db from "@/lib/firebase";

export async function POST(
    request: Request,
    { params }: { params: { code: string } },
) {
    try {
        const { code } = params;
        const { participantId, mode } = await request.json();

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

        // Verificar que el participante sea admin
        const participant = roomData.participants?.find(
            (p: any) => p.id === participantId,
        );
        if (!participant?.isAdmin) {
            return Response.json(
                { error: "Solo el administrador puede cambiar el modo" },
                { status: 403 },
            );
        }

        const participantIndex = roomData.participants.findIndex(
            (p: any) => p.id === participantId,
        );

        if (participantIndex !== -1) {
            await roomRef
                .child(`participants/${participantIndex}/adminMode`)
                .set(mode);
        }

        await roomRef.child("adminMode").set(mode);

        // Obtener datos actualizados
        const updatedSnapshot = await roomRef.once("value");
        return Response.json(updatedSnapshot.val());
    } catch (error) {
        console.error("Error en admin-mode:", error);
        return Response.json({ error: "Error del servidor" }, { status: 500 });
    }
}
