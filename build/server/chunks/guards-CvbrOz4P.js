import { r as redirect } from './index-DzcLzHBX.js';
import { getAuth } from 'firebase-admin/auth';
import { a as adminApp } from './firebase-admin-JLfANxfL.js';

async function requireAuth(event) {
  try {
    const auth = getAuth(adminApp);
    const token = event.cookies.get("firebase-token");
    if (!token) {
      throw redirect(303, `/?redirectTo=${event.url.pathname}`);
    }
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const tokenExp = decodedToken.exp * 1e3;
      const fiveMinutes = 5 * 60 * 1e3;
      if (Date.now() + fiveMinutes >= tokenExp) {
        throw new Error("Token about to expire");
      }
      return decodedToken;
    } catch (tokenError) {
      event.cookies.delete("firebase-token", { path: "/" });
      throw redirect(303, `/?redirectTo=${event.url.pathname}`);
    }
  } catch (error) {
    console.error("Auth error:", error);
    throw redirect(303, `/?redirectTo=${event.url.pathname}`);
  }
}

export { requireAuth as r };
//# sourceMappingURL=guards-CvbrOz4P.js.map
