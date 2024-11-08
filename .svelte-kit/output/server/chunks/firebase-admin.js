import { getApps, initializeApp, cert } from "firebase-admin/app";
import { F as FIREBASE_PROJECT_ID, a as FIREBASE_ADMIN_CLIENT_EMAIL, b as FIREBASE_ADMIN_PRIVATE_KEY } from "./private.js";
const adminApp = getApps().length === 0 ? initializeApp({
  credential: cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
  })
}) : getApps()[0];
export {
  adminApp as a
};
