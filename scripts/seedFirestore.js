import admin from "firebase-admin"
import fs from "fs"

const serviceAccount = JSON.parse(
  fs.readFileSync("./scripts/serviceAccountKey.json", "utf8")
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

function normalizeUsername(username = "") {
  return username.trim().toLowerCase()
}

const STATUS_POINTS = {
  "Least Concern": 5,
  "Near Threatened": 20,
  "Vulnerable": 30,
  "Endangered": 50,
  "Critically Endangered": 100,
  "Unknown": 5
}

const sightings = [
  // AVA
  {
    name: "California Poppy",
    latin: "Eschscholzia californica",
    status: "Least Concern",
    statusCode: "LC",
    confidence: 91.2,
    emoji: "🌼",
    observer: "Ava",
    username: "Ava",
    lat: 37.7694,
    lng: -122.4862,
    observedAt: "2026-03-01T10:15:00.000Z",
    taxonId: 49964,
    photo: "https://upload.wikimedia.org/wikipedia/commons/3/35/California_Poppy.jpg"
  },
  {
    name: "Coast Live Oak",
    latin: "Quercus agrifolia",
    status: "Least Concern",
    statusCode: "LC",
    confidence: 92.8,
    emoji: "🌲",
    observer: "Ava",
    username: "Ava",
    lat: 37.7718,
    lng: -122.4542,
    observedAt: "2026-03-02T14:22:00.000Z",
    taxonId: 54854,
    photo: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Quercus_agrifolia.jpg"
  },
  {
    name: "Anna’s Hummingbird",
    latin: "Calypte anna",
    status: "Least Concern",
    statusCode: "LC",
    confidence: 93.4,
    emoji: "🐦",
    observer: "Ava",
    username: "Ava",
    lat: 37.7682,
    lng: -122.4824,
    observedAt: "2026-03-03T08:10:00.000Z",
    taxonId: 1993,
    photo: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Calypte_anna_-California%2C_USA_-male-8.jpg"
  },
  {
    name: "Mission Blue Butterfly",
    latin: "Icaricia icarioides missionensis",
    status: "Endangered",
    statusCode: "EN",
    confidence: 89.9,
    emoji: "🦋",
    observer: "Ava",
    username: "Ava",
    lat: 37.7152,
    lng: -122.4948,
    observedAt: "2026-03-04T16:40:00.000Z",
    taxonId: 50771,
    photo: "https://upload.wikimedia.org/wikipedia/commons/8/84/Icaricia_icarioides_missionensis.jpg"
  },

  // LEO
  {
    name: "Monarch Butterfly",
    latin: "Danaus plexippus",
    status: "Endangered",
    statusCode: "EN",
    confidence: 96.4,
    emoji: "🦋",
    observer: "Leo",
    username: "Leo",
    lat: 37.7989,
    lng: -122.4662,
    observedAt: "2026-03-01T11:30:00.000Z",
    taxonId: 48662,
    photo: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Danaus_plexippus_Monarch_Butterfly_Male_2664px.jpg"
  },
  {
    name: "Red-tailed Hawk",
    latin: "Buteo jamaicensis",
    status: "Least Concern",
    statusCode: "LC",
    confidence: 94.7,
    emoji: "🦅",
    observer: "Leo",
    username: "Leo",
    lat: 37.8024,
    lng: -122.4481,
    observedAt: "2026-03-02T13:05:00.000Z",
    taxonId: 5263,
    photo: "https://upload.wikimedia.org/wikipedia/commons/7/70/Buteo_jamaicensis_-California_-USA-8.jpg"
  },
  {
    name: "Great Blue Heron",
    latin: "Ardea herodias",
    status: "Least Concern",
    statusCode: "LC",
    confidence: 90.3,
    emoji: "🐦",
    observer: "Leo",
    username: "Leo",
    lat: 37.8061,
    lng: -122.4314,
    observedAt: "2026-03-03T09:50:00.000Z",
    taxonId: 4930,
    photo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Ardea_herodias_fan.jpg"
  },
  {
    name: "California Pipevine",
    latin: "Aristolochia californica",
    status: "Near Threatened",
    statusCode: "NT",
    confidence: 87.6,
    emoji: "🌿",
    observer: "Leo",
    username: "Leo",
    lat: 37.7594,
    lng: -122.4476,
    observedAt: "2026-03-04T15:12:00.000Z",
    taxonId: 50884,
    photo: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Aristolochia_californica.jpg"
  },

  // MAYA
  {
    name: "Anna’s Hummingbird",
    latin: "Calypte anna",
    status: "Least Concern",
    statusCode: "LC",
    confidence: 94.1,
    emoji: "🐦",
    observer: "Maya",
    username: "Maya",
    lat: 37.7689,
    lng: -122.4827,
    observedAt: "2026-03-01T07:45:00.000Z",
    taxonId: 1993,
    photo: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Calypte_anna_-California%2C_USA_-male-8.jpg"
  },
  {
    name: "Western Gull",
    latin: "Larus occidentalis",
    status: "Least Concern",
    statusCode: "LC",
    confidence: 91.8,
    emoji: "🐦",
    observer: "Maya",
    username: "Maya",
    lat: 37.8072,
    lng: -122.4759,
    observedAt: "2026-03-02T12:35:00.000Z",
    taxonId: 4922,
    photo: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Larus_occidentalis.jpg"
  },
  {
    name: "Douglas Iris",
    latin: "Iris douglasiana",
    status: "Least Concern",
    statusCode: "LC",
    confidence: 88.9,
    emoji: "🌸",
    observer: "Maya",
    username: "Maya",
    lat: 37.7705,
    lng: -122.5102,
    observedAt: "2026-03-03T10:28:00.000Z",
    taxonId: 48159,
    photo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Iris_douglasiana.jpg"
  },
  {
    name: "California Newt",
    latin: "Taricha torosa",
    status: "Vulnerable",
    statusCode: "VU",
    confidence: 86.4,
    emoji: "🐸",
    observer: "Maya",
    username: "Maya",
    lat: 37.7581,
    lng: -122.4527,
    observedAt: "2026-03-04T17:02:00.000Z",
    taxonId: 26640,
    photo: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Taricha_torosa.jpg"
  },

  // NOAH
  {
    name: "Red-tailed Hawk",
    latin: "Buteo jamaicensis",
    status: "Least Concern",
    statusCode: "LC",
    confidence: 92.7,
    emoji: "🦅",
    observer: "Noah",
    username: "Noah",
    lat: 37.8021,
    lng: -122.4488,
    observedAt: "2026-03-01T09:20:00.000Z",
    taxonId: 5263,
    photo: "https://upload.wikimedia.org/wikipedia/commons/7/70/Buteo_jamaicensis_-California_-USA-8.jpg"
  },
  {
    name: "Black-tailed Deer",
    latin: "Odocoileus hemionus columbianus",
    status: "Least Concern",
    statusCode: "LC",
    confidence: 90.6,
    emoji: "🦌",
    observer: "Noah",
    username: "Noah",
    lat: 37.7599,
    lng: -122.5015,
    observedAt: "2026-03-02T18:14:00.000Z",
    taxonId: 43213,
    photo: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Odocoileus_hemionus_columbianus.jpg"
  },
  {
    name: "Banana Slug",
    latin: "Ariolimax columbianus",
    status: "Near Threatened",
    statusCode: "NT",
    confidence: 84.5,
    emoji: "🐚",
    observer: "Noah",
    username: "Noah",
    lat: 37.7544,
    lng: -122.4479,
    observedAt: "2026-03-03T11:48:00.000Z",
    taxonId: 47486,
    photo: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Ariolimax_columbianus.jpg"
  },
  {
    name: "Mission Blue Butterfly",
    latin: "Icaricia icarioides missionensis",
    status: "Endangered",
    statusCode: "EN",
    confidence: 90.8,
    emoji: "🦋",
    observer: "Noah",
    username: "Noah",
    lat: 37.7168,
    lng: -122.4936,
    observedAt: "2026-03-05T14:55:00.000Z",
    taxonId: 50771,
    photo: "https://upload.wikimedia.org/wikipedia/commons/8/84/Icaricia_icarioides_missionensis.jpg"
  },

  // LILY
  {
    name: "Monarch Butterfly",
    latin: "Danaus plexippus",
    status: "Endangered",
    statusCode: "EN",
    confidence: 91.4,
    emoji: "🦋",
    observer: "Lily",
    username: "Lily",
    lat: 37.8078,
    lng: -122.4750,
    observedAt: "2026-03-03T13:11:00.000Z",
    taxonId: 48662,
    photo: "/images/MonarchButterfly.jpeg"
  },
  {
    name: "San Francisco Lessingia",
    latin: "Lessingia germanorum",
    status: "Critically Endangered",
    statusCode: "CR",
    confidence: 85.7,
    emoji: "🌸",
    observer: "Lily",
    username: "Lily",
    lat: 37.7712,
    lng: -122.5108,
    observedAt: "2026-03-05T12:22:00.000Z",
    taxonId: 56487,
    photo: "/images/SanFranciscoLessingia.jpg"
  }
]

function buildLeaderboardFromSightings(allSightings) {
  const byUser = {}

  for (const s of allSightings) {
    const username = s.username || s.observer || "Explorer"
    const usernameKey = normalizeUsername(username)

    if (!byUser[usernameKey]) {
      byUser[usernameKey] = {
        username,
        usernameKey,
        totalPoints: 0,
        totalScans: 0,
        rareFound: 0,
        endangeredFound: 0,
        lastScan: s.observedAt,
        lat: s.lat,
        lng: s.lng
      }
    }

    const row = byUser[usernameKey]
    row.totalScans += 1
    row.totalPoints += STATUS_POINTS[s.status] || 5

    if (["Near Threatened", "Vulnerable"].includes(s.status)) {
      row.rareFound += 1
    }

    if (["Endangered", "Critically Endangered"].includes(s.status)) {
      row.endangeredFound += 1
    }

    if (new Date(s.observedAt).getTime() > new Date(row.lastScan).getTime()) {
      row.lastScan = s.observedAt
      row.lat = s.lat
      row.lng = s.lng
    }
  }

  return Object.values(byUser)
}

async function clearCollection(name) {
  const snap = await db.collection(name).get()
  const batch = db.batch()

  snap.forEach((docSnap) => {
    batch.delete(docSnap.ref)
  })

  await batch.commit()
}

async function seed() {
  console.log("Clearing old seeded data...")
  await clearCollection("sightings")
  await clearCollection("leaderboard")

  console.log("Seeding sightings...")
  for (const s of sightings) {
    const usernameKey = normalizeUsername(s.username || s.observer)

    await db.collection("sightings").add({
      ...s,
      usernameKey,
      timestamp: admin.firestore.Timestamp.fromDate(new Date(s.observedAt))
    })
  }

  console.log("Building leaderboard from sightings...")
  const leaderboardRows = buildLeaderboardFromSightings(sightings)

  for (const row of leaderboardRows) {
    await db.collection("leaderboard").doc(row.usernameKey).set({
      ...row,
      lastScan: admin.firestore.Timestamp.fromDate(new Date(row.lastScan))
    })
  }

  console.log("✅ Firestore seeded successfully")
  process.exit()
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})






