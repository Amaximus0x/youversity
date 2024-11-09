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
  if (event.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      }
    });
  }
  const response = await resolve(event);
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
};
export {
  handle
};
