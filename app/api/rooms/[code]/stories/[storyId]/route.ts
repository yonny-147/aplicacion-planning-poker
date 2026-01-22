import db from "@/lib/firebase";

export async function DELETE(
    request: Request,
    { params }: { params: { code: string; storyId: string } },
) {
    try {
        const { code, storyId } = params;
        const { searchParams } = new URL(request.url);
        const participantId = searchParams.get("participantId");

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
                { error: "Solo el administrador puede eliminar historias" },
                { status: 403 },
            );
        }

        // Eliminar historia
        const stories = roomData.stories || [];
        const updatedStories = stories.filter((s: any) => s.id !== storyId);

        await roomRef.child("stories").set(updatedStories);

        // Si la historia eliminada era la seleccionada, limpiar la selección
        if (roomData.selectedStoryId === storyId) {
            await roomRef.child("selectedStoryId").set(null);
        }

        // Obtener datos actualizados
        const updatedSnapshot = await roomRef.once("value");
        return Response.json(updatedSnapshot.val());
    } catch (error) {
        console.error("Error en story DELETE:", error);
        return Response.json({ error: "Error del servidor" }, { status: 500 });
    }
}
