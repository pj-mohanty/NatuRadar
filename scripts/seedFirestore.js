import admin from "firebase-admin"
import fs from "fs"

// load service account json
const serviceAccount = JSON.parse(
  fs.readFileSync("./scripts/serviceAccountKey.json", "utf8")
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

const users = [
  { id: "u1", username: "Ava", totalPoints: 240, totalScans: 12 },
  { id: "u2", username: "Leo", totalPoints: 360, totalScans: 18 },
  { id: "u3", username: "Maya", totalPoints: 210, totalScans: 10 },
  { id: "u4", username: "Noah", totalPoints: 420, totalScans: 21 },
]

const sightings = [
  {
    name: "California Poppy",
    latin: "Eschscholzia californica",
    status: "Least Concern",
    emoji: "🌼",
    observer: "Ava",
    lat: 37.7694,
    lng: -122.4862
  },
  {
    name: "Monarch Butterfly",
    latin: "Danaus plexippus",
    status: "Endangered",
    emoji: "🦋",
    observer: "Leo",
    lat: 37.7989,
    lng: -122.4662
  },
  {
    name: "Red-tailed Hawk",
    latin: "Buteo jamaicensis",
    status: "Least Concern",
    emoji: "🦅",
    observer: "Noah",
    lat: 37.8021,
    lng: -122.4488
  },
  {
    name: "Anna’s Hummingbird",
    latin: "Calypte anna",
    status: "Least Concern",
    emoji: "🐦",
    observer: "Maya",
    lat: 37.7689,
    lng: -122.4827
  }
]

async function seed() {
  console.log("Seeding leaderboard...")

  for (const u of users) {
    await db.collection("leaderboard").doc(u.id).set({
      ...u,
      rareFound: 2,
      endangeredFound: 1,
      lastScan: new Date()
    })
  }

  console.log("Seeding sightings...")

  for (const s of sightings) {
    await db.collection("sightings").add({
      ...s,
      timestamp: new Date(),
      observedAt: new Date().toISOString()
    })
  }

  console.log("✅ Firestore seeded successfully")
  process.exit()
}

seed()