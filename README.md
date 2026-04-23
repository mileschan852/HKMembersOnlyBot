# HKMOC - HK Members Only Chat

A Grindr-inspired **Telegram Mini App** for Hong Kong's gay social scene. Dark-themed profile grid with distance-based matching, editable stats, preference toggles, TON wallet integration, and direct Telegram chat links. **Zero backend hosting costs** — all user data lives in Telegram CloudStorage.

![HKMOC](https://img.shields.io/badge/Telegram-Mini%20App-26A5E4?logo=telegram)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)
![TON](https://img.shields.io/badge/TON-Connect-0088CC)

---

## Features

- **5-column profile grid** — see 13+ users at a glance, no scrolling needed
- **Distance badges** — know who's nearby (0m to 2.5km)
- **Online indicators** — pulsing green dot for active users
- **Photo carousel** — horizontal snap-scroll through Telegram profile photos
- **3 preference toggles** — Safe/Raw, Clean/Party, 1on1/Group (color-coded)
- **Role filter** — cycle through Top/Vers Top/Versatile/Vers Bottom/Bottom
- **Direct messaging** — tap "Message" to open private Telegram chat
- **Group chat link** — one-tap to @hkmembersonlychat
- **TON Wallet connect** — ready for Web3 features
- **Zero data hosting** — everything stored in Telegram CloudStorage

---

## Architecture

| Component | Technology | Cost |
|---|---|---|
| Frontend | React 19 + Vite + Tailwind CSS | **Free** (Vercel/Netlify) |
| User Data | Telegram CloudStorage | **Free** (1MB per user) |
| Profile Photos | Telegram `photo_url` | **Free** (Telegram CDN) |
| Authentication | Telegram Mini App native | **Free** (signed initData) |
| Name | Telegram `first_name` | **Free** |
| Wallet | TON Connect | **Free** (testnet) |

**Total monthly cost: $0**

---

## Data Flow

```
User opens Mini App in Telegram
        |
        v
Telegram injects initData:
  - user.id, user.first_name, user.photo_url
  - cryptographically signed
        |
        v
App loads saved data from CloudStorage:
  - height, weight, position
  - preference1, preference2, preference3
        |
        v
User edits a value --> auto-saves to CloudStorage
User taps Message --> opens t.me/{username}
```

---

## Telegram CloudStorage Keys

| Key | Value Example | Description |
|---|---|---|
| `hk_height` | `178` | Height in cm |
| `hk_weight` | `72` | Weight in kg |
| `hk_position` | `Versatile` | Position preference |
| `hk_pref1` | `Safe` | Safe or Raw |
| `hk_pref2` | `Clean` | Clean or Party |
| `hk_pref3` | `1on1` | 1on1 or Group |

All data is **private per user per bot**, cross-device persistent, and free.

---

## Quick Start

### Prerequisites

- Node.js 20+
- A Telegram bot (create with [@BotFather](https://t.me/BotFather))
- (Optional) A TON Connect manifest for wallet features

### Local Development

```bash
# 1. Clone
git clone https://github.com/mileschan852/HKMembersOnlyBot.git
cd HKMembersOnlyBot

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open in browser at http://localhost:5173
#    (Mock data will display since you're not in Telegram)
```

> **Note:** Telegram APIs (CloudStorage, initData) only work inside the Telegram WebView. Outside Telegram, the app runs with mock data for UI development.

### Build for Production

```bash
npm run build
```

Output goes to `dist/` — deploy this folder to any static host.

---

## Deploy to Production

### 1. Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repo at [vercel.com](https://vercel.com) for auto-deploy on every push.

### 2. Set up Telegram Mini App

1. Message [@BotFather](https://t.me/BotFather)
2. Create a bot: `/newbot` → name it → save your **bot token**
3. Set menu button: `/mybots` → your bot → **Bot Settings** → **Menu Button** → **Configure menu button**
4. Set button text: `Open App`
5. Set URL: your deployed app URL (e.g., `https://hkmembersonlybot.vercel.app`)

### 3. Verify

- Open your bot in Telegram
- Tap the menu button
- Your app should launch with your Telegram name and photo loaded automatically

---

## Project Structure

```
HKMembersOnlyBot/
├── public/
│   └── profiles/          # Mock user photos (dev only, not needed in production)
├── src/
│   ├── App.tsx            # All screens, state management, Telegram API
│   ├── App.css            # Component styles (gradient, animations)
│   ├── index.css          # Global styles, Tailwind, keyframe animations
│   └── main.tsx           # Entry point (no router needed)
├── index.html             # HTML entry with viewport meta for mobile
├── vite.config.ts         # Vite config with path aliases
├── tailwind.config.js     # Tailwind + shadcn theme
├── tsconfig.json          # TypeScript config
└── package.json
```

---

## Screens

### Main Screen
- 5-column grid of nearby users
- Filter tabs: Nearby / Online / Roles (position cycle)
- Your preference badges inline (Safe/Clean/1on1)
- "You" tile at top-left with orange label
- Tap any photo → fullscreen carousel overlay

### Photo Overlay
- Horizontal snap-scroll through all Telegram profile photos
- Pagination dots + photo counter
- Name, age, distance, online status
- Stats: height, weight, position, 3 preferences
- **Message button** → opens `t.me/{username}` private chat

### Edit Profile Screen
- Telegram photo carousel (read-only, marked "Telegram")
- 3 preference toggle buttons (color-coded)
- Editable: height, weight, position
- Read-only: name (from Telegram), age (from Telegram)
- Auto-saves to CloudStorage on every change

---

## TON Connect (Optional)

To enable TON wallet features:

1. Create `public/tonconnect-manifest.json`:
```json
{
  "url": "https://your-deployed-url.com",
  "name": "HKMOC",
  "iconUrl": "https://your-deployed-url.com/icon.png"
}
```

2. Install: `npm install @tonconnect/ui-react`

3. Wrap your app in `main.tsx`:
```tsx
import { TonConnectUIProvider } from '@tonconnect/ui-react'

<TonConnectUIProvider manifestUrl="https://your-url/tonconnect-manifest.json">
  <App />
</TonConnectUIProvider>
```

---

## Future Enhancements

### Real Nearby Users (needs minimal backend)

For real geolocation-based matching, add a tiny backend:

```
User opens app → sends (lat, lng, user_id, preferences) to backend
Backend stores in Supabase/Firebase free tier
Query returns users within X meters with matching preferences
```

**Free backend options:**
- **Supabase**: 500MB PostgreSQL + 1GB storage
- **Firebase Spark**: 1GB database + 10GB/month
- **Vercel Edge Functions**: 1M requests/month

### Multiple Profile Photos

Telegram Mini App gives you one `photo_url`. To get ALL profile photos:

```bash
# Call from your backend
curl https://api.telegram.org/bot<TOKEN>/getUserProfilePhotos?user_id=<USER_ID>
```

Returns file IDs for all photos. Fetch URLs via `getFile`, store in CloudStorage as `hk_photos` JSON array.

---

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast builds
- **Tailwind CSS** for styling
- **shadcn/ui** components (pre-installed)
- **Lucide React** for icons
- **Telegram WebApp API** (CloudStorage, initData)

---

## License

Private project for HK Members Only Chat community.

---

Built with ❤️ for the Hong Kong community.
