import { j as json } from './index-DzcLzHBX.js';

const POST = async ({ request, cookies }) => {
  const { token } = await request.json();
  if (!token) {
    return json({ error: "No token provided" }, { status: 400 });
  }
  cookies.set("firebase-token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60
    // 1 hour
  });
  return json({ success: true });
};

export { POST };
//# sourceMappingURL=_server.ts-B1SOrWJN.js.map
