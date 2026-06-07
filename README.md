# AkopFit

An online-coaching client app (PWA) — your clients' hub for nutrition targets,
macro split, training split, weight/steps/cardio logs, and weekly check-ins with
progress photos. Dark, mobile-first, installable to the iPhone home screen.

> **Phase 1 (this build):** client-facing app, data saved locally on the device.
> **Phase 2 (planned):** Supabase backend — client login, cloud sync, and a coach
> dashboard so you see every client's check-ins in one place.

## Features
- **Home** — today's calories left, macro rings, steps, cardio, today's workout, latest coach message
- **Nutrition** — calorie target, macro split breakdown, quick food logging
- **Training** — your full training split, exercise list per day, mark workouts complete
- **Progress** — weight trend chart vs. goal, log weight, steps & cardio, full history
- **Check-in** — weekly progress photos, weigh-in, energy/sleep/hunger ratings, adherence, message to coach
- **Settings** — edit profile, goal, units, and all daily targets

## Run it
```bash
npm install          # if cache errors: npm install --cache /tmp/npm-cache
npm run dev          # http://localhost:5173
npm run build        # production build -> dist/
npm run preview      # serve the production build
```

## Install on iPhone
Open the deployed URL in Safari → Share → **Add to Home Screen**. It launches
full-screen like a native app, with the AkopFit icon.

## Tech
React + TypeScript + Vite · Tailwind CSS · React Router · Recharts · vite-plugin-pwa.
All data persists in `localStorage` under the key `akopfit:data:v1`.
