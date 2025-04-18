import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCka4iV6yjEfraXgvdP2soKjGEwVZXTxg0",
    authDomain: "essay-8f833.firebaseapp.com",
    projectId: "essay-8f833",
    storageBucket: "essay-8f833.firebasestorage.app",
    messagingSenderId: "987939497935",
    appId: "1:987939497935:web:0b3658417784f41f6254ba",
    measurementId: "G-K5CBRGHN0Y"
  };
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// User Profile Management
export const createUserProfile = async (uid, userData) => {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...userData,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid, data) => {
  if (!uid) throw new Error('User ID is required');
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const getUserProfile = async (uid) => {
  if (!uid) throw new Error('User ID is required');
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Authentication functions
export const signup = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const login = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logout = () => {
  return signOut(auth);
};

// Calendar Event functions
export const saveCalendarEvent = async (uid, eventData) => {
  try {
    const eventRef = await addDoc(collection(db, 'calendar_events'), {
      userId: uid,
      ...eventData,
      createdAt: new Date().toISOString()
    });
    return eventRef.id;
  } catch (error) {
    console.error('Error saving calendar event:', error);
    throw error;
  }
};

export const getUserEvents = async (uid) => {
  try {
    const q = query(collection(db, 'calendar_events'), where('userId', '==', uid));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user events:', error);
    throw error;
  }
};

// Calendar Events
export const createCalendarEvent = async (uid, eventData) => {
  try {
    const docRef = await addDoc(collection(db, 'calendar'), {
      userId: uid,
      ...eventData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

export const getCalendarEvents = async (uid) => {
  try {
    const q = query(collection(db, 'calendar'), where('userId', '==', uid));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
};

export const updateCalendarEvent = async (eventId, updates) => {
  try {
    const eventRef = doc(db, 'calendar', eventId);
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
};

export const getTestsByUser = async (userId) => {
  try {
    const q = query(
      collection(db, 'test'),
      where('userId', '==', userId),
      orderBy('metadata.createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching tests:', error);
    throw error;
  }
};

// Single consolidated export at the end of the file
export { 
  app as default,
  auth,
  db,
//   createUserProfile,
//   updateUserProfile,
//   getUserProfile,
//   signup,
//   login,
//   logout,
//   saveCalendarEvent,
//   getUserEvents,
//   createCalendarEvent,
//   getCalendarEvents,
//   updateCalendarEvent
};
