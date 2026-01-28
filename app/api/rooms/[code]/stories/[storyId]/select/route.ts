import db from "@/lib/firebase";

export async function POST(
    request: Request,
    { params }: { params: { code: string; storyId: string } },
) {
    try {
        const { code, storyId } = params;
        const { participantId } = await request.json();

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
                { error: "Solo el administrador puede seleccionar historias" },
                { status: 403 },
            );
        }

        // Verificar que la historia existe
        const storyExists = roomData.stories?.some(
            (s: any) => s.id === storyId,
        );
        if (!storyExists) {
            return Response.json(
                { error: "La historia no existe" },
                { status: 404 },
            );
        }

        // Seleccionar historia y resetear votos
        const participants = roomData.participants || [];
        const resetParticipants = participants.map((p: any) => ({
            ...p,
            vote: null,
            hasVoted: false,
        }));

        await roomRef.update({
            selectedStoryId: storyId,
            participants: resetParticipants,
            votesRevealed: false,
        });

        // Obtener datos actualizados
        const updatedSnapshot = await roomRef.once("value");
        return Response.json(updatedSnapshot.val());
    } catch (error) {
        console.error("Error en story select:", error);
        return Response.json({ error: "Error del servidor" }, { status: 500 });
    }
}
