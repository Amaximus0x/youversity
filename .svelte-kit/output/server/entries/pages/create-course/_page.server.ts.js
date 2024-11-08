import { r as requireAuth } from "../../../chunks/guards.js";
const load = async (event) => {
  await requireAuth(event);
  return {
    // Add any additional data needed for course creation
  };
};
export {
  load
};
