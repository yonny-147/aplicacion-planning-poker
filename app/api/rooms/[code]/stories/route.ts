import db from "@/lib/firebase";

export async function POST(
    request: Request,
    { params }: { params: { code: string } },
) {
    try {
        const { code } = params;
        const { title, description, participantId } = await request.json();

        if (!title?.trim()) {
            return Response.json(
                { error: "El título es requerido" },
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
                { error: "Solo el administrador puede crear historias" },
                { status: 403 },
            );
        }

        // Crear nueva historia
        const newStory = {
            id: `story-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            title: title.trim(),
            description: description?.trim() || "",
            createdAt: Date.now(),
        };

        const stories = roomData.stories || [];
        const updatedStories = [...stories, newStory];

        await roomRef.child("stories").set(updatedStories);

        // Obtener datos actualizados
        const updatedSnapshot = await roomRef.once("value");
        return Response.json(updatedSnapshot.val());
    } catch (error) {
        console.error("Error en stories POST:", error);
        return Response.json({ error: "Error del servidor" }, { status: 500 });
    }
}
