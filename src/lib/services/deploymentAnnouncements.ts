import { db } from '$lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { NotificationService } from './notificationService';

interface DeploymentVersion {
  version: string;
  lastAnnouncementSent: string | null;
}

export class DeploymentAnnouncements {
  private static readonly COLLECTION = 'deploymentVersions';
  private static readonly VERSION_DOC = 'current';
  
  // Current deployment version - update this when you want to send new announcements
  private static readonly CURRENT_VERSION = '1.0.0';

  static async checkAndSendDeploymentAnnouncements() {
    try {
      // Get the last announced version
      const versionDoc = await getDoc(doc(db, this.COLLECTION, this.VERSION_DOC));
      const lastVersion = versionDoc.exists() ? (versionDoc.data() as DeploymentVersion).version : null;

      // If this is a new version, send announcements
      if (!lastVersion || lastVersion !== this.CURRENT_VERSION) {
        await this.sendDeploymentAnnouncements();
        
        // Update the version document
        await setDoc(doc(db, this.COLLECTION, this.VERSION_DOC), {
          version: this.CURRENT_VERSION,
          lastAnnouncementSent: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error checking deployment announcements:', error);
    }
  }

  private static async sendDeploymentAnnouncements() {
    // Add your deployment announcements here
    // await NotificationService.announceNewFeature(
    //   'New Features Available',
    //   'Exciting news! Explore the latest features and improvements on Youversity.'
    // );

    // // You can add multiple announcements for the same deployment
    // await NotificationService.sendTip(
    //   'Did You Know?',
    //   'You can now organize your courses into custom playlists. Give it a try today!'
    // );
  }
} 