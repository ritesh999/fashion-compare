# FlashPrice — AI Fashion Price Comparison

Compare prices across ASOS, Zalando, Zara, H&M, Uniqlo, Mango, Shein, Pull&Bear — powered by Claude AI.

## Stack
- **Next.js 15** (App Router)
- **Claude claude-sonnet-4** + `web_search_20250305` tool (server-side)
- **TypeScript**
- **Vercel** (deploy)

---

## Deploy in 5 minutes

### Step 1 — Create GitHub repo

```bash
# On GitHub.com → New repository → name: "fashion-compare" → Create

# Then in this folder:
git init
git add .
git commit -m "feat: initial fashion price comparison app"
git branch -M main
git remote add origin https://github.com/ritesh999/fashion-compare.git
git push -u origin main
```

### Step 2 — Deploy to Vercel

1. Go to **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Select **fashion-compare** from your GitHub (ritesh999)
4. Framework: **Next.js** (auto-detected)
5. Click **"Environment Variables"** → Add:
   - `ANTHROPIC_API_KEY` = `sk-ant-api03-...` (from console.anthropic.com)
6. Click **Deploy** ✅

### Step 3 — Done!

Your app will be live at `https://fashion-compare.vercel.app`

Every push to `main` auto-deploys.

---

## Local development

```bash
npm install
cp .env.example .env.local
# Edit .env.local → add your ANTHROPIC_API_KEY

npm run dev
# Open http://localhost:3000
```

## Project structure

```
fashion-compare/
├── app/
│   ├── layout.tsx          ← HTML head, fonts, metadata
│   ├── page.tsx            ← Root page
│   └── api/
│       └── search/
│           └── route.ts    ← Server-side agent (SSE stream)
├── components/
│   └── FashionApp.tsx      ← Full UI (3 screens)
├── types/
│   └── fashion.ts          ← TypeScript types
├── .env.example            ← Env var template
├── .gitignore
├── next.config.mjs
├── package.json
└── tsconfig.json
```

## How it works

```
User types "blue slim jeans"
        ↓
POST /api/search (server-side — API key safe)
        ↓
Claude claude-sonnet-4 + web_search tool
        ↓ fires real web searches per retailer
SSE stream → terminal log updates live
        ↓
Results page: chart + cards + filters + best deal banner
```
