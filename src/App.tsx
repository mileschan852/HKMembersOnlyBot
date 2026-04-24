import { useState, useEffect, useRef } from 'react'
import './App.css'
import {
  ChevronRight,
  Grid3X3,
  Users,
  Compass,
  Wallet,
  ArrowLeft,
  Check,
  MapPin,
  X,
  MessageCircle,
  LocateFixed,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────

interface UserProfile {
  id: string
  name: string
  age: number
  height: number
  weight: number
  position: number        // 0.0 to 1.0
  isSide: boolean
  isOnline: boolean
  distance: number
  lat?: number
  lng?: number
  isOwn?: boolean
  preference1?: 'Safe' | 'Raw'
  preference2?: 'Clean' | 'Party'
  preference3?: '1on1' | 'Group'
  tgUsername?: string
  tgPhotoUrl?: string
  tgPhotos?: string[]
}

type View = 'MAIN' | 'OWN_PROFILE'

// ─── Telegram WebApp API ───────────────────────────────────────────────

interface TgWebApp {
  ready: () => void
  expand: () => void
  setHeaderColor: (color: string) => void
  openTelegramLink: (url: string) => void
  openLink: (url: string) => void
  initDataUnsafe: {
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
      photo_url?: string
    }
  }
  CloudStorage: {
    setItem: (key: string, value: string, cb?: (err: string | null, done: boolean) => void) => void
    getItems: (keys: string[], cb: (err: string | null, result: Record<string, string>) => void) => void
  }
}

const tgWebApp = (): TgWebApp | undefined => {
  try {
    const w = window as unknown as { Telegram?: { WebApp?: TgWebApp } }
    return w.Telegram?.WebApp
  } catch { return undefined }
}

// ─── Cloud Storage Keys ──────────────────────────────────────────────

const CLOUD = {
  height: 'hk_height',
  weight: 'hk_weight',
  position: 'hk_position',
  isSide: 'hk_isSide',
  pref1: 'hk_pref1',
  pref2: 'hk_pref2',
  pref3: 'hk_pref3',
  lat: 'hk_lat',
  lng: 'hk_lng',
}

// ─── Role Format Helpers ─────────────────────────────────────────────

function formatRole(value: number, isSide: boolean): string {
  if (isSide) return 'Side'
  if (value === 0) return '0 Bottom'
  if (value === 1) return '1 Top'
  if (value <= 0.35) return `${value.toFixed(1)} Versatile Bottom`
  if (value <= 0.65) return `${value.toFixed(1)} Versatile`
  return `${value.toFixed(1)} Versatile Top`
}

function getRoleLabel(value: number, isSide: boolean): string {
  if (isSide) return 'Side'
  if (value === 0) return 'B'
  if (value === 1) return 'T'
  if (value <= 0.35) return 'VB'
  if (value <= 0.65) return 'V'
  return 'VT'
}

// ─── Filter Logic ────────────────────────────────────────────────────

const ROLE_CYCLE = ['All', 'B', 'VB', 'V', 'VT', 'T', 'Side']

function passesRoleFilter(user: UserProfile, filter: string | null): boolean {
  if (!filter || filter === 'All') return true
  if (filter === 'Side') return user.isSide
  if (user.isSide) return false
  const v = user.position
  if (filter === 'B') return v === 0
  if (filter === 'VB') return v > 0 && v <= 0.35
  if (filter === 'V') return v >= 0.4 && v <= 0.65
  if (filter === 'VT') return v >= 0.7 && v < 1
  if (filter === 'T') return v === 1
  return true
}

function passesOppositeFilter(user: UserProfile, me: UserProfile): boolean {
  if (me.isSide) return user.isSide
  if (user.isSide) return true
  const myVal = me.position
  const theirVal = user.position
  if (myVal >= 0.9) return theirVal <= 0.65
  if (myVal <= 0.1) return theirVal >= 0.35
  if (myVal >= 0.4 && myVal <= 0.65) return true
  if (myVal >= 0.7 && myVal < 1) return theirVal < 0.9
  if (myVal > 0.1 && myVal <= 0.35) return theirVal > 0.1
  return true
}

// ─── Distance Format ─────────────────────────────────────────────────

function formatDist(d: number): string {
  if (d === 0) return '0m'
  if (d < 1000) return `${Math.round(d)}m`
  return `${(d / 1000).toFixed(1)}km`
}

// ─── Photo Overlay ────────────────────────────────────────────────────

function PhotoOverlay({ user, onClose, onMessage }: { user: UserProfile; onClose: () => void; onMessage: (u: UserProfile) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const photos = user.tgPhotos?.length ? user.tgPhotos : (user.tgPhotoUrl ? [user.tgPhotoUrl] : [])
  const role = formatRole(user.position, user.isSide)

  const handleScroll = () => {
    if (!scrollRef.current) return
    setActiveIdx(Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth))
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col animate-in fade-in duration-200">
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#1A1A1A]/80 flex items-center justify-center z-20 nav-press">
        <X className="w-5 h-5 text-white" />
      </button>

      <div className="flex-1 flex items-center relative">
        {photos.length > 0 ? (
          <>
            <div ref={scrollRef} onScroll={handleScroll} className="w-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
              {photos.map((photo, i) => (
                <div key={i} className="w-full flex-shrink-0 snap-center flex items-center justify-center">
                  <img src={photo} alt={`${user.name} ${i + 1}`} className="max-w-full max-h-[65vh] object-contain" draggable={false} />
                </div>
              ))}
            </div>
            {photos.length > 1 && (
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <span className="text-white text-xs font-medium">{activeIdx + 1} / {photos.length}</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-[#1A1A1A] flex items-center justify-center">
              <span className="text-4xl font-bold text-[#8E8E93]">{user.name.charAt(0)}</span>
            </div>
          </div>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-3">
          {photos.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all duration-200 ${i === activeIdx ? 'w-4 bg-[#FF6B35]' : 'w-1.5 bg-[#8E8E93]/40'}`} />)}
        </div>
      )}

      <div className="w-full px-4 pb-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-lg">{user.name}, {user.age}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />
              <span className="text-[#8E8E93] text-xs">{formatDist(user.distance)}</span>
              {user.isOnline && <span className="ml-2 px-1.5 py-0.5 bg-[#00D4AA]/20 text-[#00D4AA] text-[10px] font-bold rounded-full">ONLINE</span>}
            </div>
          </div>
          {!user.isOwn && (
            <button onClick={() => onMessage(user)} className="h-10 gradient-btn rounded-xl text-white font-semibold text-sm nav-press flex items-center gap-2 px-5">
              <MessageCircle className="w-4 h-4" />Message
            </button>
          )}
        </div>
        <div className="flex gap-3 mt-3 text-xs">
          <span className="text-[#8E8E93]">{user.height}cm</span>
          <span className="text-[#8E8E93]">{user.weight}kg</span>
          <span className="text-[#FF6B35] font-bold">{role}</span>
          {user.preference1 && <span className={`font-bold ${user.preference1 === 'Safe' ? 'text-green-400' : 'text-red-400'}`}>{user.preference1}</span>}
          {user.preference2 && <span className={`font-bold ${user.preference2 === 'Clean' ? 'text-blue-400' : 'text-purple-400'}`}>{user.preference2}</span>}
          {user.preference3 && <span className={`font-bold ${user.preference3 === '1on1' ? 'text-yellow-400' : 'text-orange-400'}`}>{user.preference3}</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Location Gate ─────────────────────────────────────────────────────

function LocationGate({ onGranted }: { onGranted: (lat: number, lng: number) => void }) {
  const [status, setStatus] = useState<'checking' | 'needed' | 'requesting' | 'denied'>('checking')

  const requestLocation = () => {
    setStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => { onGranted(pos.coords.latitude, pos.coords.longitude) },
      () => { setStatus('denied') },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => onGranted(pos.coords.latitude, pos.coords.longitude),
      () => setStatus('needed'),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    )
  }, [])

  if (status === 'checking') {
    return (
      <div className="fixed inset-0 z-[70] bg-[#0A0A0A] flex flex-col items-center justify-center">
        <LocateFixed className="w-12 h-12 text-[#FF6B35] animate-pulse mb-4" />
        <p className="text-white font-semibold">Checking location...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 rounded-full bg-[#FF6B35]/10 flex items-center justify-center mb-4">
        <LocateFixed className="w-8 h-8 text-[#FF6B35]" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Location Required</h2>
      <p className="text-[#8E8E93] text-sm text-center mb-6">
        HKMOC needs your location to show nearby members. Your location is only used to calculate distances.
      </p>
      {status === 'denied' && (
        <div className="bg-[#1A1A1A] border border-[#2C2C2E] rounded-xl p-4 mb-4 w-full max-w-sm">
          <p className="text-[#FF6B35] text-sm font-semibold mb-1">Permission Denied</p>
          <p className="text-[#8E8E93] text-xs">Enable location in device settings, then tap below to retry.</p>
        </div>
      )}
      <button onClick={requestLocation} disabled={status === 'requesting'} className="w-full max-w-sm h-12 gradient-btn rounded-xl text-white font-semibold text-sm nav-press flex items-center justify-center gap-2">
        <LocateFixed className="w-4 h-4" />
        {status === 'requesting' ? 'Getting location...' : 'Share My Location'}
      </button>
    </div>
  )
}

// ─── Main Screen ───────────────────────────────────────────────────────

function MainScreen({ ownProfile, users, onViewOwnProfile, onViewPhoto }: {
  ownProfile: UserProfile
  users: UserProfile[]
  onViewOwnProfile: () => void
  onViewPhoto: (u: UserProfile) => void
}) {
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [useOpposite, setUseOpposite] = useState(true)
  const [photoLoaded, setPhotoLoaded] = useState(false)

  const cycleRole = () => {
    const idx = roleFilter === null ? 0 : ROLE_CYCLE.indexOf(roleFilter)
    const next = idx >= ROLE_CYCLE.length - 1 ? null : ROLE_CYCLE[idx + 1]
    setRoleFilter(next)
    setUseOpposite(false)
  }

  const filteredUsers = users.filter((u) => {
    if (onlineOnly && !u.isOnline) return false
    if (useOpposite && !roleFilter) return passesOppositeFilter(u, ownProfile)
    if (roleFilter) return passesRoleFilter(u, roleFilter)
    return true
  })

  const roleLabel = getRoleLabel(ownProfile.position, ownProfile.isSide)
  const photo = ownProfile.tgPhotoUrl

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#2C2C2E] px-3 py-2.5">
        <h1 className="text-xl font-bold gradient-text tracking-tight">HKMOC</h1>
      </div>

      {/* Filters + Preferences */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <button onClick={() => { setOnlineOnly(false); setUseOpposite(true); setRoleFilter(null); }} className={`px-3 py-1 rounded-full text-xs font-medium transition-all nav-press flex-shrink-0 ${!onlineOnly && useOpposite && !roleFilter ? 'gradient-btn text-white' : 'bg-[#1A1A1A] text-[#8E8E93] border border-[#2C2C2E]'}`}>Nearby</button>
          <button onClick={() => setOnlineOnly(true)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all nav-press flex-shrink-0 ${onlineOnly ? 'gradient-btn text-white' : 'bg-[#1A1A1A] text-[#8E8E93] border border-[#2C2C2E]'}`}>Online</button>
          <button onClick={cycleRole} className={`px-3 py-1 rounded-full text-xs font-bold transition-all nav-press flex-shrink-0 ${roleFilter ? 'gradient-btn text-white' : 'bg-[#1A1A1A] text-[#8E8E93] border border-[#2C2C2E]'}`}>{roleFilter || 'Roles'}</button>
          <div className="w-px h-4 bg-[#2C2C2E] mx-1 flex-shrink-0" />
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${ownProfile.preference1 === 'Safe' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{ownProfile.preference1}</span>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${ownProfile.preference2 === 'Clean' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{ownProfile.preference2}</span>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${ownProfile.preference3 === '1on1' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-orange-500/20 text-orange-400'}`}>{ownProfile.preference3}</span>
        </div>
      </div>

      {/* Own Profile */}
      <div className="px-3 pb-3">
        <button onClick={onViewOwnProfile} className="w-full flex items-center gap-3 p-2.5 bg-[#1A1A1A] border border-[#FF6B35]/50 rounded-xl nav-press text-left">
          <div className="relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-[#242424]">
            {photo && (
              <img src={photo} alt="You" className={`w-full h-full object-cover ${photoLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setPhotoLoaded(true)} onError={() => setPhotoLoaded(false)} />
            )}
            {!photoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-[#8E8E93]">{ownProfile.name.charAt(0)}</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-[#0088CC]/70 text-center py-0.5">
              <span className="text-white text-[7px] font-bold uppercase">TG</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{ownProfile.name} <span className="text-[#8E8E93] font-normal">({ownProfile.age})</span></p>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#8E8E93]">
              <span>{ownProfile.height}cm</span>
              <span>{ownProfile.weight}kg</span>
              <span className="text-[#FF6B35] font-bold">{roleLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-[#FF6B35]/10 px-2 py-1 rounded-full flex-shrink-0">
            <MapPin className="w-3 h-3 text-[#FF6B35]" />
            <span className="text-xs font-medium text-[#FF6B35]">0m</span>
          </div>
        </button>
      </div>

      {/* User Grid — real data only */}
      <div className="px-3">
        {users.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#2C2C2E] rounded-xl">
            <Users className="w-8 h-8 text-[#2C2C2E] mx-auto mb-2" />
            <p className="text-[#8E8E93] text-xs">No members nearby yet</p>
            <p className="text-[#8E8E93] text-[10px] mt-1">Be the first to join</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-[#2C2C2E] mx-auto mb-2" />
            <p className="text-[#8E8E93] text-xs">No members match this filter</p>
            <button onClick={() => { setRoleFilter(null); setUseOpposite(true); }} className="text-[#FF6B35] text-xs mt-2 nav-press">Reset filter</button>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1.5">
            {filteredUsers.map((user, i) => (
              <button
                key={user.id}
                onClick={() => onViewPhoto(user)}
                className="card-enter relative aspect-[3/4] rounded-lg overflow-hidden nav-press text-left"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {user.tgPhotoUrl ? (
                  <img src={user.tgPhotoUrl} alt={user.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                    <span className="text-lg font-bold text-[#8E8E93]">{user.name.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 profile-photo-gradient" />
                {user.isOnline && <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#00D4AA] rounded-full online-pulse" />}
                <div className="absolute bottom-0 left-0 right-0 px-1 pb-1">
                  <p className="font-semibold text-[10px] leading-tight truncate text-white">{user.name}</p>
                  <p className="text-[#FF6B35] text-[9px] font-medium">{formatDist(user.distance)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-3 pt-2 flex items-center justify-between text-[10px] text-[#8E8E93]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00D4AA]" />Online</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#8E8E93]" />Offline</span>
        </div>
        <span className="text-[#FF6B35]">You = orange</span>
      </div>
    </div>
  )
}

// ─── Own Profile Screen ────────────────────────────────────────────────

function OwnProfileScreen({ profile, onUpdate, onBack }: {
  profile: UserProfile; onUpdate: (p: UserProfile) => void; onBack: () => void
}) {
  const [editField, setEditField] = useState<string | null>(null)
  const [photoLoaded, setPhotoLoaded] = useState(false)

  const saveToCloud = (field: string, value: string) => {
    const tg = tgWebApp()
    if (tg?.CloudStorage) tg.CloudStorage.setItem(field, value)
  }

  const update = (field: keyof UserProfile, value: unknown) => {
    const updated = { ...profile, [field]: value }
    onUpdate(updated)
    const keyMap: Record<string, string> = {
      height: CLOUD.height, weight: CLOUD.weight,
      position: CLOUD.position, isSide: CLOUD.isSide,
      preference1: CLOUD.pref1, preference2: CLOUD.pref2, preference3: CLOUD.pref3,
    }
    if (keyMap[field]) saveToCloud(keyMap[field], String(value))
  }

  const togglePref = (field: 'preference1' | 'preference2' | 'preference3', a: string, b: string) => {
    update(field, profile[field] === a ? b : a)
  }

  const photo = profile.tgPhotoUrl

  return (
    <div className="h-full flex flex-col view-enter">
      {/* Header */}
      <div className="shrink-0 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#2C2C2E] px-3 py-2.5 flex items-center justify-between">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center nav-press"><ArrowLeft className="w-4 h-4 text-white" /></button>
        <h2 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-white pointer-events-none">Edit Profile</h2>
        <div className="w-8" />
      </div>

      {/* All content — no scroll */}
      <div className="flex-1 flex flex-col px-3 pt-3 pb-2 overflow-hidden">

        {/* Photo + Stats Row */}
        <div className="flex gap-3 shrink-0">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#1A1A1A]">
            {photo && (
              <img src={photo} alt="You" className={`w-full h-full object-cover ${photoLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setPhotoLoaded(true)} onError={() => setPhotoLoaded(false)} />
            )}
            {!photoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-[#8E8E93]">{profile.name.charAt(0)}</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-[#0088CC]/70 text-center py-0.5">
              <span className="text-white text-[7px] font-bold uppercase">TG</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-base">{profile.name}</span>
              <span className="text-[#8E8E93] text-sm">{profile.age}</span>
              {profile.isOnline && <span className="px-1.5 py-0.5 bg-[#00D4AA]/20 text-[#00D4AA] text-[9px] font-bold rounded-full">ONLINE</span>}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
              <span>{profile.height}cm</span>
              <span className="text-[#2C2C2E]">|</span>
              <span>{profile.weight}kg</span>
              <span className="text-[#2C2C2E]">|</span>
              <span className="text-[#FF6B35] font-bold">{formatRole(profile.position, profile.isSide)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => togglePref('preference1', 'Safe', 'Raw')} className={`text-[10px] font-bold px-2 py-0.5 rounded-full nav-press ${profile.preference1 === 'Safe' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{profile.preference1}</button>
              <button onClick={() => togglePref('preference2', 'Clean', 'Party')} className={`text-[10px] font-bold px-2 py-0.5 rounded-full nav-press ${profile.preference2 === 'Clean' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{profile.preference2}</button>
              <button onClick={() => togglePref('preference3', '1on1', 'Group')} className={`text-[10px] font-bold px-2 py-0.5 rounded-full nav-press ${profile.preference3 === '1on1' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-orange-500/20 text-orange-400'}`}>{profile.preference3}</button>
            </div>
          </div>
        </div>

        <div className="shrink-0 h-px bg-[#2C2C2E] my-3" />

        {/* Height / Weight */}
        <div className="shrink-0 space-y-1.5">
          <button onClick={() => setEditField(editField === 'height' ? null : 'height')} className="w-full flex items-center justify-between px-3 py-2 bg-[#1A1A1A] rounded-lg text-left nav-press">
            <span className="text-xs text-[#8E8E93] font-medium uppercase">Height</span>
            <div className="flex items-center gap-1.5">
              {editField === 'height' ? (
                <input autoFocus type="number" value={profile.height} onChange={(e) => update('height', parseInt(e.target.value) || 0)} className="bg-transparent text-white text-sm font-medium text-right outline-none w-16" onClick={(e) => e.stopPropagation()} />
              ) : (<span className="text-white text-sm font-medium">{profile.height} cm</span>)}
              <ChevronRight className={`w-3 h-3 text-[#8E8E93] transition-transform ${editField === 'height' ? 'rotate-90' : ''}`} />
            </div>
          </button>

          <button onClick={() => setEditField(editField === 'weight' ? null : 'weight')} className="w-full flex items-center justify-between px-3 py-2 bg-[#1A1A1A] rounded-lg text-left nav-press">
            <span className="text-xs text-[#8E8E93] font-medium uppercase">Weight</span>
            <div className="flex items-center gap-1.5">
              {editField === 'weight' ? (
                <input autoFocus type="number" value={profile.weight} onChange={(e) => update('weight', parseInt(e.target.value) || 0)} className="bg-transparent text-white text-sm font-medium text-right outline-none w-16" onClick={(e) => e.stopPropagation()} />
              ) : (<span className="text-white text-sm font-medium">{profile.weight} kg</span>)}
              <ChevronRight className={`w-3 h-3 text-[#8E8E93] transition-transform ${editField === 'weight' ? 'rotate-90' : ''}`} />
            </div>
          </button>
        </div>

        <div className="shrink-0 h-px bg-[#2C2C2E] my-3" />

        {/* Role Section */}
        <div className="shrink-0 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => update('isSide', false)}
              className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all nav-press ${!profile.isSide ? 'gradient-btn text-white' : 'bg-[#1A1A1A] text-[#8E8E93] border border-[#2C2C2E]'}`}
            >
              {formatRole(profile.position, false)}
            </button>
            <button
              onClick={() => update('isSide', true)}
              className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all nav-press ${profile.isSide ? 'gradient-btn text-white' : 'bg-[#1A1A1A] text-[#8E8E93] border border-[#2C2C2E]'}`}
            >
              Side
            </button>
          </div>

          {!profile.isSide && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#8E8E93]">
                <span>0 (Bottom)</span>
                <span className="text-white font-bold text-xs">{profile.position.toFixed(1)}</span>
                <span>1 (Top)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={profile.position}
                onChange={(e) => update('position', parseFloat(e.target.value))}
                className="w-full h-2 bg-[#2C2C2E] rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#FF6B35' }}
              />
              <div className="flex justify-between px-1">
                {[0, 0.2, 0.4, 0.6, 0.8, 1].map(v => (
                  <span key={v} className={`text-[8px] ${Math.abs(profile.position - v) < 0.05 ? 'text-[#FF6B35] font-bold' : 'text-[#8E8E93]'}`}>{v.toFixed(1)}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0" />

        {/* Save */}
        <div className="shrink-0 pt-2">
          <button onClick={onBack} className="w-full h-10 gradient-btn rounded-xl text-white font-semibold text-sm nav-press flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Bottom Nav ──────────────────────────────────────────────────────

function BottomNav() {
  const handleGroupChat = () => {
    try {
      const tg = tgWebApp()
      // Try openTelegramLink first (opens inside Telegram app)
      if (tg?.openTelegramLink) {
        tg.openTelegramLink('https://t.me/hkmembersonlychat')
        return
      }
      // Fallback to openLink
      if (tg?.openLink) {
        tg.openLink('https://t.me/hkmembersonlychat')
        return
      }
    } catch (err) {
      console.error('Group chat error:', err)
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-[#2C2C2E]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="max-w-[430px] mx-auto h-14 flex items-center justify-around">
        <button className="nav-press flex flex-col items-center gap-0.5 min-w-[50px] text-[#FF6B35]"><Grid3X3 className="w-5 h-5" /><span className="text-[9px] font-medium">Profiles</span></button>
        <button onClick={handleGroupChat} className="nav-press flex flex-col items-center gap-0.5 min-w-[50px] text-[#FF6B35]"><Users className="w-5 h-5" /><span className="text-[9px] font-medium">Group Chat</span></button>
        <button className="flex flex-col items-center gap-0.5 min-w-[50px] text-[#8E8E93]/30"><Compass className="w-5 h-5" /><span className="text-[9px] font-medium">Explore</span></button>
        <button className="flex flex-col items-center gap-0.5 min-w-[50px] text-[#8E8E93]/30"><Wallet className="w-5 h-5" /><span className="text-[9px] font-medium">Wallet</span></button>
      </div>
    </nav>
  )
}

// ─── App ─────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>('MAIN')
  const [ownProfile, setOwnProfile] = useState<UserProfile>({
    id: 'own', name: 'You', age: 0, height: 178, weight: 72,
    position: 0.5, isSide: false, isOnline: true, distance: 0, isOwn: true,
    preference1: 'Safe', preference2: 'Clean', preference3: '1on1',
    tgUsername: '', tgPhotoUrl: '', tgPhotos: [],
  })
  const [users, _setUsers] = useState<UserProfile[]>([])
  const [photoOverlay, setPhotoOverlay] = useState<UserProfile | null>(null)
  const [locationGranted, setLocationGranted] = useState(false)

  // ── Load from Telegram + CloudStorage ────────────────────────────
  useEffect(() => {
    const tg = tgWebApp()
    if (!tg) return

    tg.ready()
    tg.expand()
    tg.setHeaderColor('#0A0A0A')

    const user = tg.initDataUnsafe?.user
    if (user) {
      setOwnProfile(prev => ({
        ...prev,
        name: user.first_name || prev.name,
        tgUsername: user.username || prev.tgUsername,
        tgPhotoUrl: user.photo_url || prev.tgPhotoUrl,
        tgPhotos: user.photo_url ? [user.photo_url] : prev.tgPhotos,
      }))
    }

    tg.CloudStorage.getItems(Object.values(CLOUD), (err, result) => {
      if (err || !result) return
      setOwnProfile(prev => ({
        ...prev,
        height: result[CLOUD.height] ? parseInt(result[CLOUD.height]) : prev.height,
        weight: result[CLOUD.weight] ? parseInt(result[CLOUD.weight]) : prev.weight,
        position: result[CLOUD.position] ? parseFloat(result[CLOUD.position]) : prev.position,
        isSide: result[CLOUD.isSide] === 'true',
        preference1: (result[CLOUD.pref1] as UserProfile['preference1']) || prev.preference1,
        preference2: (result[CLOUD.pref2] as UserProfile['preference2']) || prev.preference2,
        preference3: (result[CLOUD.pref3] as UserProfile['preference3']) || prev.preference3,
      }))
    })

    // TODO: Fetch real nearby users from backend
    // fetch(`${API_URL}/nearby?lat=${lat}&lng=${lng}`)
    //   .then(r => r.json())
    //   .then(data => setUsers(data))
  }, [])

  const handleLocationGranted = (lat: number, lng: number) => {
    setLocationGranted(true)
    setOwnProfile(prev => ({ ...prev, lat, lng }))

    // Save to CloudStorage
    const tg = tgWebApp()
    if (tg?.CloudStorage) {
      tg.CloudStorage.setItem(CLOUD.lat, String(lat))
      tg.CloudStorage.setItem(CLOUD.lng, String(lng))
    }

    // TODO: Replace with real backend call
    // fetch(`${API_URL}/nearby?lat=${lat}&lng=${lng}&radius=5000`)
    //   .then(r => r.json())
    //   .then(data => setUsers(data))
  }

  const handleMessage = (user: UserProfile) => {
    const tg = tgWebApp()
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/${user.tgUsername || user.name.toLowerCase()}`)
    }
  }

  if (!locationGranted) {
    return (
      <div className="min-h-screen bg-neutral-950 flex justify-center">
        <div className="w-full max-w-[430px] bg-[#0A0A0A] h-screen relative">
          <LocationGate onGranted={handleLocationGranted} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex justify-center">
      <div className="w-full max-w-[430px] bg-[#0A0A0A] h-screen relative flex flex-col">
        {view === 'MAIN' ? (
          <MainScreen ownProfile={ownProfile} users={users} onViewOwnProfile={() => setView('OWN_PROFILE')} onViewPhoto={(u) => setPhotoOverlay(u)} />
        ) : (
          <OwnProfileScreen profile={ownProfile} onUpdate={setOwnProfile} onBack={() => setView('MAIN')} />
        )}
        {photoOverlay && (
          <PhotoOverlay user={photoOverlay} onClose={() => setPhotoOverlay(null)} onMessage={handleMessage} />
        )}
        <BottomNav />
      </div>
    </div>
  )
}
