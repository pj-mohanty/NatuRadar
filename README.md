# NatuRadar

**Live:** [natu-radar.vercel.app](https://natu-radar.vercel.app)

A gamified biodiversity discovery app. Take a photo of any plant or animal, get an AI-powered species identification, earn points, and compete with others on the leaderboard.

Built at **DonsHack 2026 Hackathon**

## Team

- [Padmaja Mohanty](https://github.com/pj-mohanty)
- Pooja Venkates
- [Jonathan Samuel Jayaseelan](https://github.com/Joe2k)

## What it does

- **Scan** — take or upload a photo to identify a species
- **Log** — every scan is saved with your photo, location, and species data
- **BioDex** — your personal collection of discovered species
- **Leaderboard** — earn points based on species rarity, compete with others
- **Missions** — daily and weekly goals to keep exploring

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite |
| Hosting | Vercel |
| External APIs | iNaturalist API · Anthropic Claude API |
| Photo storage | Cloudinary |
| Database | Firebase Firestore |

## Quick Start

**1. Clone and install**
```bash
git clone https://github.com/pj-mohanty/NatuRadar.git
cd NatuRadar
npm install
```

**2. Set up environment variables**
```bash
cp .env.example .env
```

Fill in `.env` with your credentials:

| Variable | Where to get it |
|----------|----------------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `INAT_TOKEN` | [inaturalist.org/users/api_token](https://www.inaturalist.org/users/api_token) *(expires daily)* |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | [cloudinary.com](https://cloudinary.com) → Dashboard |
| `VITE_FIREBASE_*` | Firebase Console → Project Settings → Your Apps |

**3. Run locally**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Deploy

Push to GitHub, import on [Vercel](https://vercel.com), add the same env vars in project settings. Done.

## Tests

```bash
npm test                 # unit tests
npm run test:integration # real API calls (needs valid env vars)
```

## AI Usage

We used [Claude Code](https://claude.ai/code) by Anthropic as a pair programming assistant throughout development.
