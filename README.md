# Forge — Arcane Realm

Premium React/Vite website for the Forge Minecraft server, with a Three.js arcane scene, animated routes, Markdown wiki, rank journeys, Discord integration, and a secure backend.

## Stack

React, Vite, Framer Motion, React Three Fiber, Tailwind, Express, Discord.js, and dotenv.

## Run locally

1. Copy `.env.example` to `.env` and populate only backend values.
2. Install packages: `npm install`
3. Start frontend and backend: `npm run dev:all`
4. Open the Vite URL (normally `http://localhost:5173`).

For a production frontend build run `npm run build`. Start the API with `npm run server`.

## Discord setup

Create a Discord application and bot, enable the Guild Members and Presence intents if online presence is required, and set `DISCORD_BOT_TOKEN` and `DISCORD_GUILD_ID` only in `.env`. Never put a token in the React application or commit `.env`.

## Minecraft status

Set `MINECRAFT_SERVER_IP` in `.env`. The backend uses a public status lookup and returns an unavailable state rather than inventing player counts if it cannot reach the realm.

## Wiki and assets

Markdown files in `src/docs/` automatically appear in the Forge Wiki. Replace rank images under `public/ranks/` while retaining the filenames or update `src/config/server.js`.

## Feedback

Feedback is persisted to `backend/data/feedback.json` (ignored by Git). Optionally set `DISCORD_FEEDBACK_WEBHOOK` server-side to forward staff notifications.

## Security

If a Discord bot token was shared in chat or committed anywhere, revoke it immediately and issue a replacement. Frontend code never reads Discord credentials.
