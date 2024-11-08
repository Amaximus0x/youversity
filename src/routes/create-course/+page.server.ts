import { requireAuth } from '$lib/server/guards';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  await requireAuth(event);
  return {
    // Add any additional data needed for course creation
  };
}; 