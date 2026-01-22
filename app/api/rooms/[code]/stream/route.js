import roomStore from "@/lib/room-store";
// TODO: Migrate to Firebase - Use db.ref().on('value', callback) for real-time updates
// import db, { DB_PREFIX } from "@/lib/firebase"

// Server-Sent Events para sincronización en tiempo real
export async function GET(request, { params }) {
    const { code } = params;

    console.log(`[Stream] Nueva solicitud de stream para sala ${code}`);

    const encoder = new TextEncoder();
    let cleanup = () => {};
    let heartbeatId = null;
    let subscriber = null;
    let isClosed = false;

    const stream = new ReadableStream({
        async start(controller) {
            try {
                console.log(`[Stream] Iniciando stream para sala ${code}`);
                // Enviar estado inicial
                const initialRoom = await roomStore.getRoom(code);
                if (initialRoom) {
                    console.log(
                        `[Stream] Enviando estado inicial. Participantes: ${initialRoom.participants?.length || 0}`,
                    );
                    // Sugerencia de reconexión en caso de desconexión (ms)
                    controller.enqueue(encoder.encode(`retry: 3000\n`));
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify(initialRoom)}\n\n`,
                        ),
                    );
                } else {
                    console.log(`[Stream] Sala ${code} no encontrada`);
                }

                // Configurar listener para actualizaciones
                const handleRoomUpdate = (room) => {
                    try {
                        if (isClosed) return;
                        console.log(
                            `[Stream] handleRoomUpdate llamado para sala ${code}`,
                        );
                        if (room) {
                            console.log(
                                `[Stream] Enviando actualización. Participantes: ${room.participants?.length || 0}, Historias: ${room.stories?.length || 0}`,
                            );
                            controller.enqueue(
                                encoder.encode(
                                    `data: ${JSON.stringify(room)}\n\n`,
                                ),
                            );
                        }
                    } catch (error) {
                        if (!isClosed) {
                            console.error(
                                "[Stream] Error en handleRoomUpdate:",
                                error,
                            );
                        }
                    }
                };

                // Registrar listener local (mismo proceso) como fallback
                console.log(
                    `[Stream] Registrando listener local para sala ${code}`,
                );
                roomStore.addListener(code, handleRoomUpdate);

                // TODO: Migrate to Firebase - Use Firebase onValue listener
                // const roomRef = db.ref(`${DB_PREFIX}/rooms/${code}`)
                // const firebaseUnsubscribe = roomRef.on('value', (snapshot) => {
                //   const room = snapshot.val()
                //   if (room && !isClosed) {
                //     controller.enqueue(encoder.encode(`data: ${JSON.stringify(room)}\n\n`))
                //   }
                // })

                // Suscribirse a Pub/Sub de Redis para recibir cambios desde otras instancias (DISABLED)
                // Redis has been removed - Firebase will handle real-time sync automatically
                /*
                try {
                    subscriber = redis.duplicate();
                    await subscriber.subscribe(
                        `${REDIS_PREFIX}room-updates:${code}`,
                    );
                    console.log(
                        `[Stream] Suscrito a canal Redis ${REDIS_PREFIX}room-updates:${code}`,
                    );
                    subscriber.on("message", (channel, message) => {
                        try {
                            if (isClosed) return;
                            const room = JSON.parse(message);
                            controller.enqueue(
                                encoder.encode(
                                    `data: ${JSON.stringify(room)}\n\n`,
                                ),
                            );
                        } catch (err) {
                            if (!isClosed) {
                                console.error(
                                    "[Stream] Error procesando mensaje Redis:",
                                    err,
                                );
                            }
                        }
                    });
                } catch (e) {
                    console.error(
                        "[Stream] No se pudo suscribir a Redis Pub/Sub:",
                        e,
                    );
                }
                */

                // Heartbeat para mantener viva la conexión en proxies/timeouts
                heartbeatId = setInterval(() => {
                    try {
                        if (isClosed) {
                            clearInterval(heartbeatId);
                            heartbeatId = null;
                            return;
                        }
                        controller.enqueue(encoder.encode(`: ping\n\n`));
                    } catch (err) {
                        if (!isClosed) {
                            console.error(
                                "[Stream] Error enviando heartbeat:",
                                err,
                            );
                        }
                        clearInterval(heartbeatId);
                        heartbeatId = null;
                    }
                }, 15000); // cada 15s

                // Configurar limpieza
                cleanup = () => {
                    try {
                        if (isClosed) return;
                        isClosed = true;
                        console.log(
                            `[Stream] Limpiando listener para sala ${code}`,
                        );
                        roomStore.removeListener(code, handleRoomUpdate);
                        if (heartbeatId) {
                            clearInterval(heartbeatId);
                            heartbeatId = null;
                        }
                        // TODO: Firebase cleanup - unsubscribe from Firebase listener
                        // if (firebaseUnsubscribe) {
                        //   roomRef.off('value', firebaseUnsubscribe)
                        // }
                        /*
                        if (subscriber) {
                            try {
                                subscriber.unsubscribe(
                                    `${REDIS_PREFIX}room-updates:${code}`,
                                );
                            } catch {}
                            try {
                                subscriber.quit();
                            } catch {}
                            subscriber = null;
                        }
                        */
                        try {
                            controller.close();
                        } catch (e) {
                            // Controller ya cerrado, ignorar
                        }
                    } catch (error) {
                        console.error("[Stream] Error en cleanup:", error);
                    }
                };

                // Configurar abort handler
                request.signal.addEventListener("abort", cleanup, {
                    once: true,
                });
                console.log(
                    `[Stream] Stream configurado completamente para sala ${code}`,
                );
            } catch (error) {
                console.error("[Stream] Error en start:", error);
                cleanup();
            }
        },
        cancel() {
            cleanup();
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            // Desactivar buffering en algunos proxies/servidores
            "X-Accel-Buffering": "no",
        },
    });
}
