import admin from "firebase-admin";

const isProd = process.env.NODE_ENV === "production";

let app;

try {
    app = admin.apps.length ? admin.app() : null;

    if (!app) {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : {
                  projectId: process.env.FIREBASE_PROJECT_ID,
                  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(
                      /\\n/g,
                      "\n",
                  ),
              };

        app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        });

        console.log("Firebase Admin inicializado correctamente");
    }
} catch (error) {
    console.error("Error inicializando Firebase Admin:", error);
    throw error;
}

const db = admin.database();

if (isProd) {
    setInterval(async () => {
        try {
            // Simple connectivity check
            const ref = db.ref(".info/connected");
            const snapshot = await ref.once("value");
            const connected = snapshot.val();
            console.log(
                `Firebase Realtime Database estado: ${connected ? "conectado" : "desconectado"}`,
            );
        } catch (err) {
            console.error("Error verificando conexión Firebase:", err);
        }
    }, 300000);
}

export default db;

export { admin };

export const DB_PREFIX = process.env.FIREBASE_PREFIX || "planning-poker";
