// @ts-nocheck
import { requireAuth } from '$lib/server/guards';
import type { PageServerLoad } from './$types';

export const load = async (event: Parameters<PageServerLoad>[0]) => {
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