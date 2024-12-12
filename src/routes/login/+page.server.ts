import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Return empty object since we don't need any server-side data for login
  return {};
};