import db from "@/lib/firebase";

export async function POST(
    request: Request,
    { params }: { params: { code: string; participantId: string } },
) {
    try {
        const { code, participantId } = params;
        const { adminId } = await request.json();

        if (!adminId) {
            return Response.json(
                { error: "ID de administrador requerido" },
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

        // Verificar que quien elimina sea admin
        const admin = roomData.participants?.find((p: any) => p.id === adminId);
        if (!admin?.isAdmin) {
            return Response.json(
                { error: "Solo el administrador puede eliminar participantes" },
                { status: 403 },
            );
        }

        // No permitir que el admin se elimine a sí mismo
        if (adminId === participantId) {
            return Response.json(
                { error: "El administrador no puede eliminarse a sí mismo" },
                { status: 400 },
            );
        }

        // Eliminar participante
        const participants = roomData.participants || [];
        const updatedParticipants = participants.filter(
            (p: any) => p.id !== participantId,
        );

        await roomRef.child("participants").set(updatedParticipants);

        // Obtener datos actualizados
        const updatedSnapshot = await roomRef.once("value");
        return Response.json(updatedSnapshot.val());
    } catch (error) {
        console.error("Error en delete participant:", error);
        return Response.json({ error: "Error del servidor" }, { status: 500 });
    }
}
