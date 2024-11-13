import { getAuth } from 'firebase-admin/auth';
import { a as adminApp } from './firebase-admin-JLfANxfL.js';
import 'firebase-admin/app';
import './shared-server-BfUoNEXY.js';

const handle = async ({ event, resolve }) => {
  try {
    const token = event.cookies.get("firebase-token");
    if (token && adminApp.auth) {
      const auth = getAuth(adminApp);
      try {
        const decodedToken = await auth.verifyIdToken(token);
        event.locals.user = decodedToken;
      } catch (tokenError) {
        console.error("Token verification error:", tokenError);
        event.locals.user = null;
      }
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
if (process.env.NODE_ENV === "production") {
  process.env.PORT = "3000";
  process.env.HOST = "0.0.0.0";
}
process.on("SIGTERM", () => {
  console.log("Received SIGTERM signal. Performing graceful shutdown...");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("Received SIGINT signal. Performing graceful shutdown...");
  process.exit(0);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export { handle };
//# sourceMappingURL=hooks.server-CgSyaeMv.js.map
