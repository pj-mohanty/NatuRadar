import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc
} from 'firebase/firestore'

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
    lat: coords.lat,
    lng: coords.lng,
    timestamp: new Date(),
    observer: username || 'Explorer',
    observedAt: new Date().toISOString(),
    mockSeed: false
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
  'Least Concern': 5,
  'Near Threatened': 15,
  'Vulnerable': 30,
  'Endangered': 60,
  'Critically Endangered': 100
}

export async function updateLeaderboard(userId, username, result, coords) {
  if (!userId || !username) return
  const ref = doc(db, 'leaderboard', userId)
  const snap = await getDoc(ref)
  const existing = snap.exists()
    ? snap.data()
    : {
        username,
        totalPoints: 0,
        totalScans: 0,
        rareFound: 0,
        endangeredFound: 0,
        lat: coords?.lat || 0,
        lng: coords?.lng || 0
      }

  const pts = STATUS_POINTS[result.status] || 5

  await setDoc(ref, {
    ...existing,
    username,
    totalPoints: (existing.totalPoints || 0) + pts,
    totalScans: (existing.totalScans || 0) + 1,
    rareFound:
      (existing.rareFound || 0) +
      (['Near Threatened', 'Vulnerable'].includes(result.status) ? 1 : 0),
    endangeredFound:
      (existing.endangeredFound || 0) +
      (['Endangered', 'Critically Endangered'].includes(result.status) ? 1 : 0),
    lat: coords?.lat || existing.lat,
    lng: coords?.lng || existing.lng,
    lastScan: new Date(),
    mockSeed: false
  })
}

export function listenLeaderboard(callback) {
  const q = query(collection(db, 'leaderboard'), orderBy('totalPoints', 'desc'), limit(100))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

/* ------------------------------------------------------------------ */
/* MOCK SEED DATA                                                     */
/* ------------------------------------------------------------------ */

const MOCK_USERS = [
  {
    id: 'seed_user_1',
    username: 'Ava',
    totalPoints: 215,
    totalScans: 12,
    rareFound: 4,
    endangeredFound: 1,
    lat: 37.7694,
    lng: -122.4862
  },
  {
    id: 'seed_user_2',
    username: 'Leo',
    totalPoints: 340,
    totalScans: 16,
    rareFound: 5,
    endangeredFound: 2,
    lat: 37.7989,
    lng: -122.4662
  },
  {
    id: 'seed_user_3',
    username: 'Maya',
    totalPoints: 185,
    totalScans: 10,
    rareFound: 3,
    endangeredFound: 1,
    lat: 37.7596,
    lng: -122.4269
  },
  {
    id: 'seed_user_4',
    username: 'Noah',
    totalPoints: 420,
    totalScans: 21,
    rareFound: 7,
    endangeredFound: 3,
    lat: 37.8024,
    lng: -122.4058
  },
  {
    id: 'seed_user_5',
    username: 'Zara',
    totalPoints: 268,
    totalScans: 14,
    rareFound: 4,
    endangeredFound: 2,
    lat: 37.7544,
    lng: -122.4477
  }
]

const MOCK_SIGHTINGS = [
  {
    name: 'California Poppy',
    latin: 'Eschscholzia californica',
    emoji: '🌼',
    status: 'Least Concern',
    statusCode: 'LC',
    confidence: 97,
    taxonId: 54853,
    observer: 'Ava',
    lat: 37.7694,
    lng: -122.4862,
    placeName: 'Golden Gate Park'
  },
  {
    name: 'Monarch Butterfly',
    latin: 'Danaus plexippus',
    emoji: '🦋',
    status: 'Endangered',
    statusCode: 'EN',
    confidence: 96,
    taxonId: 48662,
    observer: 'Leo',
    lat: 37.7989,
    lng: -122.4662,
    placeName: 'Presidio'
  },
  {
    name: 'Western Gull',
    latin: 'Larus occidentalis',
    emoji: '🐦',
    status: 'Least Concern',
    statusCode: 'LC',
    confidence: 94,
    taxonId: 143203,
    observer: 'Maya',
    lat: 37.7596,
    lng: -122.4269,
    placeName: 'Dolores Park'
  },
  {
    name: 'Coast Live Oak',
    latin: 'Quercus agrifolia',
    emoji: '🌳',
    status: 'Least Concern',
    statusCode: 'LC',
    confidence: 93,
    taxonId: 47795,
    observer: 'Noah',
    lat: 37.7544,
    lng: -122.4477,
    placeName: 'Twin Peaks'
  },
  {
    name: 'Anna’s Hummingbird',
    latin: 'Calypte anna',
    emoji: '🐦',
    status: 'Least Concern',
    statusCode: 'LC',
    confidence: 95,
    taxonId: 144276,
    observer: 'Zara',
    lat: 37.7689,
    lng: -122.4827,
    placeName: 'Golden Gate Park'
  },
  {
    name: 'Red-tailed Hawk',
    latin: 'Buteo jamaicensis',
    emoji: '🦅',
    status: 'Least Concern',
    statusCode: 'LC',
    confidence: 92,
    taxonId: 8473,
    observer: 'Ava',
    lat: 37.8021,
    lng: -122.4488,
    placeName: 'Lands End'
  },
  {
    name: 'California Sea Lion',
    latin: 'Zalophus californianus',
    emoji: '🦭',
    status: 'Least Concern',
    statusCode: 'LC',
    confidence: 91,
    taxonId: 41654,
    observer: 'Leo',
    lat: 37.8087,
    lng: -122.4098,
    placeName: 'Fisherman’s Wharf'
  },
  {
    name: 'Mission Blue Butterfly',
    latin: 'Icaricia icarioides missionensis',
    emoji: '🦋',
    status: 'Endangered',
    statusCode: 'EN',
    confidence: 90,
    taxonId: 173673,
    observer: 'Maya',
    lat: 37.7163,
    lng: -122.4474,
    placeName: 'San Bruno Mountain'
  },
  {
    name: 'Douglas Iris',
    latin: 'Iris douglasiana',
    emoji: '🌸',
    status: 'Least Concern',
    statusCode: 'LC',
    confidence: 96,
    taxonId: 59295,
    observer: 'Noah',
    lat: 37.8003,
    lng: -122.4771,
    placeName: 'Presidio Trails'
  },
  {
    name: 'Peregrine Falcon',
    latin: 'Falco peregrinus',
    emoji: '🦅',
    status: 'Least Concern',
    statusCode: 'LC',
    confidence: 94,
    taxonId: 8471,
    observer: 'Zara',
    lat: 37.8199,
    lng: -122.4783,
    placeName: 'Golden Gate Bridge'
  },
  {
    name: 'Western Fence Lizard',
    latin: 'Sceloporus occidentalis',
    emoji: '🦎',
    status: 'Least Concern',
    statusCode: 'LC',
    confidence: 93,
    taxonId: 36140,
    observer: 'Ava',
    lat: 37.7702,
    lng: -122.5090,
    placeName: 'Ocean Beach'
  },
  {
    name: 'California Pipevine',
    latin: 'Aristolochia californica',
    emoji: '🌿',
    status: 'Vulnerable',
    statusCode: 'VU',
    confidence: 92,
    taxonId: 127316,
    observer: 'Leo',
    lat: 37.7858,
    lng: -122.5009,
    placeName: 'Sutro Heights'
  }
]

function daysAgoIso(daysAgo, hour = 12) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

function daysAgoDate(daysAgo, hour = 12) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d
}

export async function seedMockSanFranciscoData() {
  const settingsRef = doc(db, 'app_meta', 'mock_seed_v1')
  const settingsSnap = await getDoc(settingsRef)

  if (settingsSnap.exists()) {
    console.log('Mock SF seed already exists. Skipping reseed.')
    return { ok: true, skipped: true }
  }

  // Seed leaderboard
  for (const [index, user] of MOCK_USERS.entries()) {
    await setDoc(doc(db, 'leaderboard', user.id), {
      ...user,
      lastScan: daysAgoDate(index + 1, 11 + index),
      mockSeed: true,
      seededAt: new Date().toISOString()
    })
  }

  // Seed sightings
  for (const [index, sighting] of MOCK_SIGHTINGS.entries()) {
    const dayOffset = (index % 6) + 1
    const hourOffset = 9 + (index % 8)

    await addDoc(collection(db, 'sightings'), {
      ...sighting,
      timestamp: daysAgoDate(dayOffset, hourOffset),
      observedAt: daysAgoIso(dayOffset, hourOffset),
      mockSeed: true,
      seededAt: new Date().toISOString()
    })
  }

  await setDoc(settingsRef, {
    createdAt: new Date().toISOString(),
    version: 1,
    sightingsSeeded: MOCK_SIGHTINGS.length,
    usersSeeded: MOCK_USERS.length
  })

  console.log(`Seeded ${MOCK_SIGHTINGS.length} mock sightings and ${MOCK_USERS.length} leaderboard users.`)
  return {
    ok: true,
    skipped: false,
    sightingsSeeded: MOCK_SIGHTINGS.length,
    usersSeeded: MOCK_USERS.length
  }
}

export async function clearMockSanFranciscoData() {
  const sightingsSnap = await getDocs(collection(db, 'sightings'))
  for (const item of sightingsSnap.docs) {
    const data = item.data()
    if (data.mockSeed) {
      await deleteDoc(item.ref)
    }
  }

  const leaderboardSnap = await getDocs(collection(db, 'leaderboard'))
  for (const item of leaderboardSnap.docs) {
    const data = item.data()
    if (data.mockSeed) {
      await deleteDoc(item.ref)
    }
  }

  const seedRef = doc(db, 'app_meta', 'mock_seed_v1')
  const seedSnap = await getDoc(seedRef)
  if (seedSnap.exists()) {
    await deleteDoc(seedRef)
  }

  console.log('Mock SF seed cleared.')
  return { ok: true }
}