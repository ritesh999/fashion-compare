# FlashPrice — AI Fashion Price Comparison

Compare prices across ASOS, Zalando, Zara, H&M, Uniqlo, Mango, Shein, Pull&Bear — powered by Claude AI.

## Stack
- **Next.js 15** (App Router)
- **Claude claude-sonnet-4** + `web_search_20250305` tool (server-side)
- **TypeScript**
- **Vercel** (deploy)

---





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
