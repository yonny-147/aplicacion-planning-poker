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

        const selectedStoryId = roomData.selectedStoryId;
        if (selectedStoryId) {
            const stories = roomData.stories || [];
            const participants = roomData.participants || [];

            const ROLES_FOR_AVERAGE = ["QA", "DEV"];
            const result: any = {};

            ROLES_FOR_AVERAGE.forEach((role) => {
                const roleVotes = participants
                    .filter((p: any) => {
                        if (p.isAdmin && p.adminMode === "facilitator")
                            return false;
                        if (p.role && p.role.toUpperCase() === "FACILITATOR")
                            return false;
                        const normalizedRole = p.role
                            ? p.role.trim().toUpperCase()
                            : "";
                        const effectiveRole =
                            normalizedRole ||
                            (p.isAdmin && p.adminMode !== "facilitator"
                                ? "DEV"
                                : "");

                        return effectiveRole === role && p.hasVoted;
                    })
                    .map((p: any) => parseFloat(p.vote))
                    .filter((v: number) => !isNaN(v));

                if (roleVotes.length > 0) {
                    const average =
                        roleVotes.reduce(
                            (sum: number, val: number) => sum + val,
                            0,
                        ) / roleVotes.length;
                    result[role] = average.toFixed(1);
                }
            });

            const votes = participants
                .filter((p: any) => p.hasVoted)
                .map((p: any) => ({
                    participantId: p.id,
                    participantName: p.name,
                    role: p.role || "",
                    vote: p.vote,
                }));

            const updatedStories = stories.map((s: any) =>
                s.id === selectedStoryId
                    ? { ...s, voted: true, result, votes, votedAt: Date.now() }
                    : s,
            );

            await roomRef.child("stories").set(updatedStories);
        }

        // Obtener datos actualizados
        const updatedSnapshot = await roomRef.once("value");
        return Response.json(updatedSnapshot.val());
    } catch (error) {
        console.error("Error en reveal:", error);
        return Response.json({ error: "Error del servidor" }, { status: 500 });
    }
}
