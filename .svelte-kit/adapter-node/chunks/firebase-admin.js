import { getApps, initializeApp, cert } from "firebase-admin/app";
import { d as private_env } from "./shared-server.js";
console.log("Firebase Admin Environment Variables:");
console.log("Project ID exists:", !!private_env.FIREBASE_PROJECT_ID);
console.log("Client Email exists:", !!private_env.FIREBASE_ADMIN_CLIENT_EMAIL);
console.log("Private Key exists:", !!private_env.FIREBASE_ADMIN_PRIVATE_KEY);
let app;
try {
  if (getApps().length === 0) {
    if (!private_env.FIREBASE_PROJECT_ID || !private_env.FIREBASE_ADMIN_CLIENT_EMAIL || !private_env.FIREBASE_ADMIN_PRIVATE_KEY) {
      throw new Error("Missing required Firebase Admin environment variables");
    }
    app = initializeApp({
      credential: cert({
        projectId: private_env.FIREBASE_PROJECT_ID,
        clientEmail: private_env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: private_env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
      })
    });
  } else {
    app = getApps()[0];
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  app = {};
}
const adminApp = app;
export {
  adminApp as a
};
