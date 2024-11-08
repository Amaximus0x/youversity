import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { token } = await request.json();
  
  if (!token) {
    return json({ error: 'No token provided' }, { status: 400 });
  }

  cookies.set('firebase-token', token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 // 1 hour
  });

  return json({ success: true });
}; 