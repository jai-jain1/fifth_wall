# The Fifth Wall: Cloud Kitchen Walkthrough

Vite + React + TypeScript + three.js (react-three-fiber, drei, postprocessing) + zustand + framer-motion + Tailwind.

## Run locally (Windows PowerShell)
```powershell
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into /dist
npm run preview
```

## Deploy to Vercel
Option A (CLI):
```powershell
npm i -g vercel
vercel          # first time: preview deploy, accept the Vite defaults
vercel --prod
```
Option B (Git): push to GitHub, then import the repo at vercel.com/new. Framework preset: Vite. Build: `npm run build`. Output: `dist`.

## Where things are
- `src/data/layout.ts`: every zone as data (plan pixels x 0.0316 m). Edit here to change the default plan.
- `src/data/budget.ts`: budget heads (Rs lakh).
- `src/components/Scene.tsx`: 3D scene, camera rig, walls, lighting, post-processing.
- `src/components/Equipment.tsx`: hoods, burners, tables, racks, sinks, lockers.
- `src/components/Hud.tsx`: intro, panels, edit toolbar, screenshot, share.
- `src/materials.ts`: procedural tile and brushed-steel textures.
