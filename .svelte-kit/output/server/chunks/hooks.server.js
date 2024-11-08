import { getAuth } from "firebase-admin/auth";
import { a as adminApp } from "./firebase-admin.js";
const handle = async ({ event, resolve }) => {
  try {
    const token = event.cookies.get("firebase-token");
    if (token) {
      const auth = getAuth(adminApp);
      const decodedToken = await auth.verifyIdToken(token);
      event.locals.user = decodedToken;
    }
  } catch (error) {
    console.error("Auth error in hooks:", error);
    event.locals.user = null;
  }
  return resolve(event);
};
export {
  handle
};
