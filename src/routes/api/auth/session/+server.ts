import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { token } = await request.json();
  cookies.set('firebase-token', token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  });
  return json({ status: 'ok' });
};

export const DELETE: RequestHandler = async ({ cookies }) => {
  cookies.delete('firebase-token', { path: '/' });
  return json({ status: 'ok' });
}; 