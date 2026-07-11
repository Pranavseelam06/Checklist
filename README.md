# Checklist

A minimalist personal checklist PWA for private, local-only lists like No Sugar, packing, internship tasks, travel prep, or any custom challenge.

## What It Does

- Create, rename, archive, and delete unlimited checklists
- Add, edit, check, uncheck, delete, and reorder items
- Search checklist titles and item text
- Show completion progress for every checklist
- Save all data in IndexedDB on this device
- Work offline after the app has been opened once
- Install as a PWA from supported browsers

## Tech Stack

- Next.js
- TypeScript
- IndexedDB
- Service worker
- Web app manifest

There is no backend, account system, AI, analytics, cloud sync, or remote database.

## Setup

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Start the production build:

```bash
npm run start
```

## Local Data

Checklist data is stored in the browser's IndexedDB database named `personal-checklists`. It remains available after closing and reopening the app unless browser site data is cleared.

## PWA Notes

The service worker is registered from `public/sw.js`, and the manifest lives at `public/manifest.webmanifest`. For best install and offline behavior, use a production build over `http://localhost` or HTTPS.
