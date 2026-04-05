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
                { error: "ID de participante requerido" },
                { status: 400 },
            );
        }

        const roomRef = db.ref(`planning-poker/rooms/${code}`);
        const snapshot = await roomRef.once("value");
        const roomData = snapshot.val();

        if (!roomData) {
            return Response.json({ ok: true });
        }

        const participants = roomData.participants || [];
        const requester = participants.find((p: any) => p.id === adminId);
        const isSelfRemoval = adminId === participantId;

        if (isSelfRemoval) {
            if (requester?.isAdmin) {
                return Response.json(
                    { error: "El administrador no puede abandonar la sala así" },
                    { status: 400 },
                );
            }
        } else {
            if (!requester?.isAdmin) {
                return Response.json(
                    { error: "Solo el administrador puede eliminar participantes" },
                    { status: 403 },
                );
            }
        }

        const updatedParticipants = participants.filter(
            (p: any) => p.id !== participantId,
        );

        await roomRef.child("participants").set(updatedParticipants);

        const updatedSnapshot = await roomRef.once("value");
        return Response.json(updatedSnapshot.val());
    } catch (error) {
        console.error("Error en delete participant:", error);
        return Response.json({ error: "Error del servidor" }, { status: 500 });
    }
}
