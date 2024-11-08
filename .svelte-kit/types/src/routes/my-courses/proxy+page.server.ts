// @ts-nocheck
import { requireAuth } from '$lib/server/guards';
import type { PageServerLoad } from './$types';

export const load = async (event: Parameters<PageServerLoad>[0]) => {
  await requireAuth(event);
  return {};
}; 