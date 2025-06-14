import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TODO: Replace with the path to your service account key JSON file
const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Load videos from JSON file
const videosPath = path.join(__dirname, 'videos.json');
const videosData = JSON.parse(fs.readFileSync(videosPath, 'utf8'));

async function uploadVideos() {
  const videos = videosData.videos;
  for (const video of videos) {
    try {
      // Use videoId as document ID
      await db.collection('videos').doc(video.videoId).set(video);
      console.log(`Uploaded video: ${video.title} (${video.videoId})`);
    } catch (error) {
      console.error(`Failed to upload video ${video.videoId}:`, error);
    }
  }
  console.log('All videos uploaded.');
  process.exit(0);
}

uploadVideos(); 