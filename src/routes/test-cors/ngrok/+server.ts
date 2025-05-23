import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export async function GET() {
  try {
    // Get the directory of the current module
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    // Read the HTML file
    const htmlPath = join(__dirname, '..', 'ngrok-test.html');
    const html = await readFile(htmlPath, 'utf-8');
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
  } catch (error) {
    console.error('Error serving ngrok test HTML:', error);
    return new Response('Error loading test page', { status: 500 });
  }
} 