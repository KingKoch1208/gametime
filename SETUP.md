# GameTime Website — Setup Guide

## What you need first

Make sure **Node.js** is installed. Open a terminal and type:
```
node --version
```
If you see a version number (like `v20.0.0`), you're good. If not, download it at nodejs.org.

---

## Step 1 — Install all packages

Open a terminal in the `website` folder and run these **one at a time**:

```bash
npm install
```
```bash
cd server && npm install && cd ..
```
```bash
cd client && npm install && cd ..
```

---

## Step 2 — Start the app

From the `website` folder, run:

```bash
npm run dev
```

This starts **both** the backend server and the frontend at the same time.

---

## Step 3 — Open in your browser

| What           | URL                          |
|----------------|------------------------------|
| Website        | http://localhost:3000        |
| API (backend)  | http://localhost:3001/api/games |

---

## How it works

```
website/
  server/     ← Express.js API server (port 3001)
    index.js       main server file
    data/games.js  all game data (edit this to add games!)

  client/     ← React website (port 3000)
    src/
      pages/       Home, Games, GameDetail, Reminders
      components/  Navbar, Ticker, GameCard, etc.
      api.js       functions to call the backend
```

## Pages

| Page          | What it does                            |
|---------------|-----------------------------------------|
| `/`           | Home — featured games + live scores    |
| `/games`      | Browse all games, filter by sport      |
| `/games/:id`  | Game detail view                        |
| `/reminders`  | View and delete your reminders         |

## API Endpoints

| Method | URL                  | What it does           |
|--------|----------------------|------------------------|
| GET    | /api/games           | List all games         |
| GET    | /api/games?sport=nba | Filter by sport        |
| GET    | /api/games/:id       | Single game            |
| GET    | /api/reminders       | List your reminders    |
| POST   | /api/reminders       | Set a reminder         |
| DELETE | /api/reminders/:id   | Remove a reminder      |

> **Note:** Reminders are stored in memory — they reset when you restart the server. To persist them, you'd add a database like SQLite or Firebase.
