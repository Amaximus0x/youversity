import { db } from '$lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function generateUsername(displayName: string, email: string): Promise<string> {
  // Clean up display name or use email prefix
  let baseUsername = displayName 
    ? displayName.toLowerCase().replace(/[^a-z0-9]/g, '')
    : email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

  // If the base username is too short, add some random chars
  if (baseUsername.length < 4) {
    baseUsername += Math.random().toString(36).substring(2, 6);
  }

  // Try the base username first
  let username = baseUsername;
  let counter = 1;

  // Keep trying until we find an available username
  while (await isUsernameTaken(username)) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
}

async function isUsernameTaken(username: string): Promise<boolean> {
  const usernameRef = doc(db, 'usernames', username);
  const usernameDoc = await getDoc(usernameRef);
  return usernameDoc.exists();
} 