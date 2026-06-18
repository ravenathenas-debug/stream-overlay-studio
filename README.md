# Stream Overlay Studio

A real-time overlay manager for **PRISM Live Mobile**. Control browser-source overlays (TikFinity, VDO.Ninja, and generic URLs) from a second phone, with changes syncing instantly via Supabase Realtime.

---

## Features

- Add **TikFinity**, **VDO camera**, and **generic URL** overlays
- **Drag, resize, and zoom** overlays on a visual canvas
- **Lock / unlock** to prevent accidental moves
- **Toggle visibility** per overlay
- **Rename** overlays (double-tap the name)
- **Reorder layers** (move up/down)
- **Adjust opacity** per overlay
- **Preset layouts** — save, load, and delete named presets
- **Export / Import JSON** layouts
- **Auto-save** to localStorage per stream ID
- **Instant sync** — changes on the control phone appear on the overlay page without refresh
- **PWA** — add to home screen on iOS and Android

---

## Two pages

| Route | Purpose |
|---|---|
| `/overlay/:streamId` | Transparent browser source — load in PRISM Live |
| `/control/:streamId` | Control panel — open on your second phone |

Use the **same** Stream ID on both devices.

---

## Setup

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Create a new project (choose any region and password).
3. Once the project is ready, go to **Project Settings → API**.
4. Copy your **Project URL** and **anon public** key.
5. In your project root, create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> **That's it for Supabase.** Realtime Broadcast is enabled by default — no database tables needed. The app uses channels to broadcast overlay state between devices.

---

### 2. Local development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

### 3. Deploy to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/stream-overlay-studio.git
git branch -M main
git push -u origin main
```

---

### 4. Deploy to Vercel

#### Option A — Vercel CLI

```bash
npm install -g vercel
vercel
# Follow the prompts. When asked for build command: npm run build
# Output directory: dist
```

#### Option B — Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New Project** → Import your `stream-overlay-studio` repo.
3. Framework preset: **Vite** (auto-detected).
4. Add environment variables:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
5. Click **Deploy**.

#### SPA routing on Vercel

Create a `vercel.json` at the project root to handle client-side routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This file is already included in the project.

---

## Using with PRISM Live Mobile

1. Open the control panel on your second phone:
   ```
   https://your-app.vercel.app/control/mystream
   ```

2. In PRISM Live, add a **Browser Source** with the URL:
   ```
   https://your-app.vercel.app/overlay/mystream
   ```
   - Set the browser source to full screen (1920×1080 or match your stream resolution).
   - Enable **Transparent Background** in the browser source settings.

3. Add overlays on the control panel — they appear instantly in the stream.

---

## Tips

- **Stream ID** can be any alphanumeric string with hyphens/underscores (e.g. `mystream`, `gaming-2024`).
- Add the control page to your iPhone/Android home screen as a PWA for the best experience.
- The overlay page has a **transparent background** — works as-is with PRISM Live's browser source chroma/alpha support.
- Preset layouts are saved to the device (localStorage). Use **Export JSON** to back them up or move them to another device.
- If overlays aren't syncing, check that both devices are using the same Stream ID and that your Supabase credentials are set correctly.

---

## Project structure

```
stream-overlay-studio/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vercel.json
├── .env.example
├── .gitignore
├── README.md
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   └── overlay.ts
    ├── lib/
    │   └── supabase.ts
    ├── hooks/
    │   ├── useSupabaseSync.ts
    │   └── useOverlays.ts
    ├── components/
    │   ├── AddOverlayModal.tsx
    │   ├── LayerItem.tsx
    │   ├── CanvasEditor.tsx
    │   └── PresetManager.tsx
    └── pages/
        ├── OverlayPage.tsx
        └── ControlPage.tsx
```

---

## Tech stack

- **React 18** + **TypeScript** + **Vite**
- **Supabase Realtime** (Broadcast channels — no DB required)
- **React Router v6**
- **vite-plugin-pwa** — offline-capable PWA
- No backend, no server, no Node process in production
