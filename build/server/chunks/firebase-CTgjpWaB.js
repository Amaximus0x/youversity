import { initializeApp } from 'firebase/app';
import { getFirestore, query, collection, where, getDocs } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAOzl4NcFW95BEhRw-t3meFAyzfCo-vZIs",
  authDomain: "youversity-c8632.firebaseapp.com",
  projectId: "youversity-c8632",
  storageBucket: "youversity-c8632.appspot.com",
  messagingSenderId: "1021633759112",
  appId: "1:1021633759112:web:6476141a5dd9527b97dc3d"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});
async function getUserCourses(userId) {
  try {
    const q = query(collection(db, "courses"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc2) => ({
      id: doc2.id,
      ...doc2.data()
    }));
  } catch (error) {
    console.error("Error fetching user courses:", error);
    throw new Error("Failed to fetch courses");
  }
}

export { auth as a, getUserCourses as g };
//# sourceMappingURL=firebase-CTgjpWaB.js.map
