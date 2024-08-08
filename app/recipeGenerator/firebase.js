import {initializeApp} from "firebase/app";
import {getFirestore} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAfZdPtInhBYIU4mGTgXj0wSsWqdhAKlWE",
  authDomain: "pantry-tracker-1b2f2.firebaseapp.com",
  projectId: "pantry-tracker-1b2f2",
  storageBucket: "pantry-tracker-1b2f2.appspot.com",
  messagingSenderId: "335457066768",
  appId: "1:335457066768:web:6ba8d7b693644cee3b8f95",
  measurementId: "G-1EB42FDYCF"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

export {firestore, auth};