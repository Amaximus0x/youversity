import { d as derived, w as writable } from "./index3.js";
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, query, collection, where, getDocs } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
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
async function initializePersistence() {
  try {
    await enableIndexedDbPersistence(db);
  } catch (err) {
    if (err.code === "failed-precondition") {
      console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === "unimplemented") {
      console.warn("The current browser doesn't support persistence.");
    }
  }
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.error("Auth persistence error:", error);
  }
}
initializePersistence();
async function getUserCourses(userId) {
  try {
    const q = query(collection(db, "courses"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching user courses:", error);
    throw new Error("Failed to fetch courses");
  }
}
const user = writable(null);
const isAuthenticated = derived(user, ($user) => !!$user);
async function refreshToken() {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken(true);
      await fetch("/api/auth/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token })
      });
    }
  } catch (error) {
    console.error("Token refresh error:", error);
    throw error;
  }
}
auth.onAuthStateChanged(async (newUser) => {
  user.set(newUser);
  if (newUser) {
    await refreshToken();
  }
});
export {
  getUserCourses as g,
  isAuthenticated as i,
  user as u
};
