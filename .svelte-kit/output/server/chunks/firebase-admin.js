import { getApps, initializeApp, cert } from "firebase-admin/app";
import { d as private_env } from "./shared-server.js";
if (!private_env.FIREBASE_PROJECT_ID || !private_env.FIREBASE_ADMIN_CLIENT_EMAIL || !private_env.FIREBASE_ADMIN_PRIVATE_KEY) {
  throw new Error("Missing Firebase Admin environment variables");
}
const adminApp = getApps().length === 0 ? initializeApp({
  credential: cert({
    projectId: private_env.FIREBASE_PROJECT_ID,
    clientEmail: private_env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: private_env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
  })
}) : getApps()[0];
export {
  adminApp as a
};
