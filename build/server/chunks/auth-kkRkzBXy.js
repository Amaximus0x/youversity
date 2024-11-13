import { d as derived, w as writable } from './index2-DBzPtTNm.js';
import { a as auth } from './firebase-CTgjpWaB.js';

const user = writable(null);
const isAuthenticated = derived(user, ($user) => !!$user);
async function refreshToken() {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken(true);
      await fetch("/api/auth/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token })
      });
    }
  } catch (error) {
    console.error("Token refresh error:", error);
    throw error;
  }
}
auth.onAuthStateChanged(async (newUser) => {
  user.set(newUser);
  if (newUser) {
    await refreshToken();
  }
});

export { isAuthenticated as i, user as u };
//# sourceMappingURL=auth-kkRkzBXy.js.map
