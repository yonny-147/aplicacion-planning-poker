import db from "@/lib/firebase";

export async function GET(
    request: Request,
    { params }: { params: { code: string } },
) {
    try {
        const { code } = params;

        // Validar que el código tenga el formato correcto (6 caracteres alfanuméricos)
        if (!code || code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
            return Response.json(
                {
                    valid: false,
                    exists: false,
                    error: "Código inválido. Debe tener 6 caracteres alfanuméricos.",
                },
                { status: 400 },
            );
        }

        // Verificar si la sala existe en Firebase
        const roomRef = db.ref(`planning-poker/rooms/${code}`);
        const snapshot = await roomRef.once("value");
        const roomData = snapshot.val();

        if (!roomData) {
            return Response.json(
                {
                    valid: false,
                    exists: false,
                    error: "La sala no existe o ha expirado.",
                },
                { status: 404 },
            );
        }

        // Verificar si la sala está activa (opcional: puedes agregar lógica de expiración)
        const createdAt = roomData.createdAt;
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

        if (now - createdAt > maxAge) {
            return Response.json(
                {
                    valid: false,
                    exists: false,
                    error: "La sala ha expirado.",
                },
                { status: 410 },
            );
        }

        // La sala es válida
        return Response.json({
            valid: true,
            exists: true,
            participantCount: roomData.participants?.length || 0,
            room: {
                code: roomData.code,
                participantCount: roomData.participants?.length || 0,
                storiesCount: roomData.stories?.length || 0,
                createdAt: roomData.createdAt,
            },
        });
    } catch (error) {
        console.error("Error validando código de sala:", error);
        return Response.json(
            {
                valid: false,
                exists: false,
                error: "Error del servidor al validar la sala.",
            },
            { status: 500 },
        );
    }
}
