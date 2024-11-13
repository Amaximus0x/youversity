import { r as requireAuth } from "../../../chunks/guards.js";
const load = async (event) => {
  const user = await requireAuth(event);
  return {
    profile: {
      name: user.displayName,
      email: user.email,
      image: user.photoURL,
      id: user.uid
    }
  };
};
export {
  load
};
