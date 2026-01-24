import db from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: { code: string } },
) {
    const { code } = params;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const roomRef = db.ref(`planning-poker/rooms/${code}`);

            const sendData = (data: any) => {
                try {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
                    );
                } catch (error) {
                    console.error("Error enviando datos SSE:", error);
                }
            };

            const listener = roomRef.on(
                "value",
                (snapshot) => {
                    const roomData = snapshot.val();

                    if (roomData) {
                        sendData(roomData);
                    } else {
                        sendData({ deleted: true });
                    }
                },
                (error) => {
                    console.error("Error en listener de Firebase:", error);
                },
            );

            request.signal.addEventListener("abort", () => {
                roomRef.off("value", listener);
                try {
                    controller.close();
                } catch (error) {}
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
