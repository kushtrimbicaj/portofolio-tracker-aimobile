# Portfolio Tracker (Expo)

This is a small starter Expo project named "Portfolio Tracker". It's configured to run with Expo (QR/Expo Go) and includes a basic stack navigator using @react-navigation/native.

Quick start

1. Install dependencies (if running locally):

```powershell
npm install
# or
yarn
```

2. Start the project (this opens the Expo dev tools and shows a QR code):

```powershell
npm start
# or
yarn start
```

3. Scan the QR code with Expo Go (iOS/Android) or open on an emulator.

Project structure

```
/src
  /components
  /hooks
  /screens
  /services
  /types
App.js
package.json
```

Notes

- This project uses functional components and React Hooks only.
- The navigation stack is configured in `App.js`.
- `src/services/portfolioService.js` contains a mocked data fetch for demo purposes.

Expo Preview / QR notes

- `app.json` has been added and configured with the project name (`Portfolio Tracker`) and slug (`portfolio-tracker`).
- To run in Expo Go via QR code, install dependencies and run `npm start` (or `expo start`). The Expo dev tools will show a QR code you can scan with Expo Go.
- Ensure you paste your Supabase credentials into `src/services/supabaseConfig.js` before testing Supabase flows.


 Placeholder SVG assets have been added in `assets/` to avoid Expo warnings while you provide real artwork:
  - `assets/icon.svg` (1024x1024)
  - `assets/splash.svg` (1024x1024)
  - `assets/adaptive-icon.svg` (1024x1024)

  These are simple solid-color SVG placeholders. For production replace them with PNGs (recommended sizes: icon 1024x1024, splash typically 1242x2436 or similar tall aspect ratio, adaptive icon 1024x1024 foreground + background).
Cleaning and unused imports
- I removed several small unused imports across the codebase during the styling pass. If you see any linter warnings, let me know and I will tidy them up.


Supabase integration

- Paste your Supabase credentials into `src/services/supabaseConfig.js` by replacing the placeholders: `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- The app will attempt to initialize Supabase on startup if those values are set. You can also call `initSupabase(url, key)` manually.
- The Supabase helper is located at `src/services/supabase.ts` and exposes:
  - `initSupabase(url, key)` — initialize client
  - `getProjects()` — fetch all rows from `projects`
  - `createProject(payload)`, `updateProject(id, updates)`, `deleteProject(id)` — CRUD helpers
  - `subscribeToProjects(callback)` — subscribe to realtime changes on the `projects` table; returns an async unsubscribe function

Error handling: all Supabase helper functions throw on error. Wrap calls in try/catch when using them in UI code.
