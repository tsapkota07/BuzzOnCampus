// Firebase app initialization — import this before any other Firebase module
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: "AIzaSyAwDlaFL83y0klSBiuP_rG5ZbyjdHzzkvw",
  authDomain: "buzzoncampus-f9257.firebaseapp.com",
  projectId: "buzzoncampus-f9257",
  storageBucket: "buzzoncampus-f9257.firebasestorage.app",
  messagingSenderId: "342542062820",
  appId: "1:342542062820:web:758995ec307cb468948f1",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)
