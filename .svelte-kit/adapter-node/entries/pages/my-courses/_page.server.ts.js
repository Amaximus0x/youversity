import { r as requireAuth } from "../../../chunks/guards.js";
const load = async (event) => {
  await requireAuth(event);
  return {};
};
export {
  load
};
