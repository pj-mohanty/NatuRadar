import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, doc, getDoc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

export async function saveSighting(species, coords, username) {
  await addDoc(collection(db, 'sightings'), {
    ...species,
    lat: coords.lat, lng: coords.lng,
    timestamp: new Date(),
    observer: username || 'Explorer',
    observedAt: new Date().toISOString(),
  })
}

export function listenSightings(callback) {
  const q = query(collection(db, 'sightings'), orderBy('timestamp', 'desc'), limit(200))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// Points per conservation status
const STATUS_POINTS = {
  'Least Concern': 5, 'Near Threatened': 15,
  'Vulnerable': 30, 'Endangered': 60, 'Critically Endangered': 100
}

export async function updateLeaderboard(userId, username, result, coords) {
  if (!userId || !username) return
  const ref = doc(db, 'leaderboard', userId)
  const snap = await getDoc(ref)
  const existing = snap.exists() ? snap.data() : {
    username, totalPoints: 0, totalScans: 0,
    rareFound: 0, endangeredFound: 0,
    lat: coords?.lat || 0, lng: coords?.lng || 0
  }
  const pts = STATUS_POINTS[result.status] || 5
  await setDoc(ref, {
    ...existing,
    username,
    totalPoints: (existing.totalPoints || 0) + pts,
    totalScans: (existing.totalScans || 0) + 1,
    rareFound: (existing.rareFound || 0) + (['Near Threatened', 'Vulnerable'].includes(result.status) ? 1 : 0),
    endangeredFound: (existing.endangeredFound || 0) + (['Endangered', 'Critically Endangered'].includes(result.status) ? 1 : 0),
    lat: coords?.lat || existing.lat,
    lng: coords?.lng || existing.lng,
    lastScan: new Date()
  })
}

export function listenLeaderboard(callback) {
  const q = query(collection(db, 'leaderboard'), orderBy('totalPoints', 'desc'), limit(100))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}