import { j as json } from "../../../../../chunks/index2.js";
const POST = async ({ request, cookies }) => {
  const { token } = await request.json();
  cookies.set("firebase-token", token, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict"
  });
  return json({ status: "ok" });
};
const DELETE = async ({ cookies }) => {
  cookies.delete("firebase-token", { path: "/" });
  return json({ status: "ok" });
};
export {
  DELETE,
  POST
};
