import db from "@/lib/firebase";

export async function DELETE(
    request: Request,
    { params }: { params: { code: string } },
) {
    try {
        const { code } = params;
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

        const participant = roomData.participants?.find(
            (p: any) => p.id === participantId,
        );
        if (!participant?.isAdmin) {
            return Response.json(
                { error: "Solo el administrador puede eliminar la sala" },
                { status: 403 },
            );
        }

        await roomRef.remove();

        return Response.json({ success: true });
    } catch (error) {
        console.error("Error en delete room:", error);
        return Response.json({ error: "Error del servidor" }, { status: 500 });
    }
}
