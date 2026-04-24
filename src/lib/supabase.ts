// ─── Supabase REST Client ────────────────────────────────────────────
// Replace ANON_KEY with your Supabase anon key (NOT the secret key)
// Get it from: Supabase Dashboard → Project Settings → API → anon/public

const SUPABASE_URL = 'https://fngcjkclxxodjaiqkfkm.supabase.co'
const ANON_KEY = 'YOUR_ANON_KEY_HERE' // <-- Replace this

const headers = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

export interface DbUser {
  id: number
  name: string
  photo_url: string | null
  height: number
  weight: number
  position: number
  is_side: boolean
  preference1: string
  preference2: string
  preference3: string
  lat: number
  lng: number
  tg_username: string | null
  is_online: boolean
  updated_at: string
}

// Upsert own profile + location
export async function upsertUser(user: Partial<DbUser>): Promise<DbUser | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(user),
    })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    return data?.[0] || null
  } catch (err) {
    console.error('upsertUser failed:', err)
    return null
  }
}

// Fetch nearby users (simple bounding box, 0.05 degrees ≈ 5.5km)
export async function fetchNearby(lat: number, lng: number, radiusDegrees = 0.05): Promise<DbUser[]> {
  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/users`)
    url.searchParams.set('select', '*')
    url.searchParams.set('lat', `gte.${lat - radiusDegrees},lte.${lat + radiusDegrees}`)
    url.searchParams.set('lng', `gte.${lng - radiusDegrees},lte.${lng + radiusDegrees}`)
    url.searchParams.set('order', 'updated_at.desc')
    url.searchParams.set('limit', '50')

    const res = await fetch(url.toString(), { headers })
    if (!res.ok) throw new Error(await res.text())
    return await res.json()
  } catch (err) {
    console.error('fetchNearby failed:', err)
    return []
  }
}

// Mark user online/offline
export async function setOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_online: isOnline, updated_at: new Date().toISOString() }),
    })
  } catch (err) {
    console.error('setOnlineStatus failed:', err)
  }
}
