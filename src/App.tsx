import { useState, useEffect, useCallback, useRef } from 'react'
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
  Sparkles,
  X,
  MessageCircle,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────

interface UserProfile {
  id: string
  name: string
  age: number
  height: number
  weight: number
  position: string
  isOnline: boolean
  distance: number
  isOwn?: boolean
  preference1?: 'Safe' | 'Raw'
  preference2?: 'Clean' | 'Party'
  preference3?: '1on1' | 'Group'
  tgUsername?: string
  tgPhotoUrl?: string
  tgPhotos?: string[]
}

type View = 'MAIN' | 'OWN_PROFILE'

// ─── Telegram API Types ──────────────────────────────────────────────

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
  try { return (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp } catch { return undefined }
}

// ─── Cloud Storage Keys ──────────────────────────────────────────────

const CLOUD_KEYS = {
  height: 'hk_height',
  weight: 'hk_weight',
  position: 'hk_position',
  pref1: 'hk_pref1',
  pref2: 'hk_pref2',
  pref3: 'hk_pref3',
}

// ─── Mock Users ──────────────────────────────────────────────────────

const MOCK_USERS: UserProfile[] = [
  { id: 'u1', name: 'Jason', age: 25, height: 175, weight: 65, position: 'Vers Top', isOnline: true, distance: 150, preference1: 'Raw', preference2: 'Party', preference3: 'Group', tgUsername: 'jasonhk', tgPhotoUrl: '/profiles/user-1.jpg', tgPhotos: ['/profiles/user-1.jpg', '/profiles/user-5.jpg'] },
  { id: 'u2', name: 'Ryan', age: 28, height: 182, weight: 78, position: 'Top', isOnline: true, distance: 320, preference1: 'Safe', preference2: 'Clean', preference3: '1on1', tgUsername: 'ryan_hk', tgPhotoUrl: '/profiles/user-2.jpg', tgPhotos: ['/profiles/user-2.jpg', '/profiles/user-10.jpg'] },
  { id: 'u3', name: 'Daniel', age: 30, height: 180, weight: 75, position: 'Versatile', isOnline: false, distance: 500, preference1: 'Safe', preference2: 'Party', preference3: 'Group', tgUsername: 'danielhk', tgPhotoUrl: '/profiles/user-3.jpg', tgPhotos: ['/profiles/user-3.jpg', '/profiles/user-6.jpg'] },
  { id: 'u4', name: 'Ethan', age: 23, height: 170, weight: 60, position: 'Bottom', isOnline: true, distance: 80, preference1: 'Raw', preference2: 'Clean', preference3: '1on1', tgUsername: 'ethan_hk', tgPhotoUrl: '/profiles/user-4.jpg', tgPhotos: ['/profiles/user-4.jpg', '/profiles/user-9.jpg'] },
  { id: 'u5', name: 'Kevin', age: 26, height: 176, weight: 70, position: 'Vers Top', isOnline: true, distance: 210, preference1: 'Safe', preference2: 'Party', preference3: '1on1', tgUsername: 'kevin_gym', tgPhotoUrl: '/profiles/user-5.jpg', tgPhotos: ['/profiles/user-5.jpg', '/profiles/user-1.jpg'] },
  { id: 'u6', name: 'Marcus', age: 35, height: 183, weight: 80, position: 'Top', isOnline: false, distance: 890, preference1: 'Safe', preference2: 'Clean', preference3: 'Group', tgUsername: 'marcus_hk', tgPhotoUrl: '/profiles/user-6.jpg', tgPhotos: ['/profiles/user-6.jpg', '/profiles/user-3.jpg'] },
  { id: 'u7', name: 'Leo', age: 22, height: 172, weight: 63, position: 'Versatile', isOnline: true, distance: 450, preference1: 'Raw', preference2: 'Party', preference3: 'Group', tgUsername: 'leo_hikes', tgPhotoUrl: '/profiles/user-7.jpg', tgPhotos: ['/profiles/user-7.jpg', '/profiles/user-11.jpg'] },
  { id: 'u8', name: 'Brandon', age: 29, height: 178, weight: 74, position: 'Vers Bottom', isOnline: false, distance: 670, preference1: 'Raw', preference2: 'Clean', preference3: '1on1', tgUsername: 'brandon_hk', tgPhotoUrl: '/profiles/user-8.jpg', tgPhotos: ['/profiles/user-8.jpg', '/profiles/user-12.jpg'] },
  { id: 'u9', name: 'Chris', age: 27, height: 177, weight: 71, position: 'Versatile', isOnline: true, distance: 120, preference1: 'Safe', preference2: 'Clean', preference3: '1on1', tgUsername: 'chris_hk', tgPhotoUrl: '/profiles/user-9.jpg', tgPhotos: ['/profiles/user-9.jpg', '/profiles/user-4.jpg'] },
  { id: 'u10', name: 'Nathan', age: 31, height: 181, weight: 77, position: 'Top', isOnline: false, distance: 340, preference1: 'Raw', preference2: 'Party', preference3: 'Group', tgUsername: 'nathan_pool', tgPhotoUrl: '/profiles/user-10.jpg', tgPhotos: ['/profiles/user-10.jpg', '/profiles/user-2.jpg'] },
  { id: 'u11', name: 'Tyler', age: 24, height: 174, weight: 66, position: 'Bottom', isOnline: true, distance: 560, preference1: 'Raw', preference2: 'Party', preference3: 'Group', tgUsername: 'tyler_night', tgPhotoUrl: '/profiles/user-11.jpg', tgPhotos: ['/profiles/user-11.jpg', '/profiles/user-7.jpg'] },
  { id: 'u12', name: 'Adrian', age: 32, height: 179, weight: 73, position: 'Vers Top', isOnline: false, distance: 780, preference1: 'Safe', preference2: 'Clean', preference3: '1on1', tgUsername: 'adrian_art', tgPhotoUrl: '/profiles/user-12.jpg', tgPhotos: ['/profiles/user-12.jpg', '/profiles/user-8.jpg'] },
]

const POSITIONS = ['Top', 'Vers Top', 'Versatile', 'Vers Bottom', 'Bottom']

// ─── Toast ───────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className="fixed top-4 left-0 right-0 z-[70] flex justify-center animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="bg-[#242424] border border-[#2C2C2E] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 max-w-sm">
        <Sparkles className="w-4 h-4 text-[#FF6B35]" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}

// ─── Photo Carousel Overlay ──────────────────────────────────────────

function PhotoOverlay({ user, onClose, onMessage }: { user: UserProfile; onClose: () => void; onMessage: (u: UserProfile) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const photos = user.tgPhotos?.length ? user.tgPhotos : (user.tgPhotoUrl ? [user.tgPhotoUrl] : [])

  const handleScroll = () => {
    if (!scrollRef.current) return
    setActiveIdx(Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth))
  }

  const formatDist = (d: number) => d === 0 ? '0m' : d < 1000 ? `${d}m` : `${(d / 1000).toFixed(1)}km`

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
              {user.isOnline && <span className="px-1.5 py-0.5 bg-[#00D4AA]/20 text-[#00D4AA] text-[10px] font-bold rounded-full">ONLINE</span>}
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
          <span className="text-[#8E8E93]">{user.position}</span>
          {user.preference1 && <span className={`font-bold ${user.preference1 === 'Safe' ? 'text-green-400' : 'text-red-400'}`}>{user.preference1}</span>}
          {user.preference2 && <span className={`font-bold ${user.preference2 === 'Clean' ? 'text-blue-400' : 'text-purple-400'}`}>{user.preference2}</span>}
          {user.preference3 && <span className={`font-bold ${user.preference3 === '1on1' ? 'text-yellow-400' : 'text-orange-400'}`}>{user.preference3}</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Main Screen ─────────────────────────────────────────────────────

function MainScreen({
  ownProfile, users, onViewOwnProfile, onViewPhoto,
}: {
  ownProfile: UserProfile
  users: UserProfile[]
  onViewOwnProfile: () => void
  onViewPhoto: (u: UserProfile) => void
}) {
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [roleFilter, setRoleFilter] = useState<string | null>(null)

  // Role cycle: null (All) → Top → Vers Top → Versatile → Vers Bottom → Bottom → null
  const cycleRole = () => {
    if (roleFilter === null) setRoleFilter('Top')
    else {
      const idx = POSITIONS.indexOf(roleFilter)
      setRoleFilter(idx < POSITIONS.length - 1 ? POSITIONS[idx + 1] : null)
    }
  }

  const allUsers = [ownProfile, ...users]
  const filteredUsers = allUsers.filter((u) => {
    if (onlineOnly && !u.isOnline) return false
    if (roleFilter && u.position !== roleFilter) return false
    return true
  })

  const formatDist = (d: number) => d === 0 ? '0m' : d < 1000 ? `${d}m` : `${(d / 1000).toFixed(1)}km`

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#2C2C2E] px-3 py-2.5">
        <h1 className="text-xl font-bold gradient-text tracking-tight">HKMOC</h1>
      </div>

      {/* Filters + Preferences — single row */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {/* Nearby */}
          <button onClick={() => setOnlineOnly(false)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all nav-press flex-shrink-0 ${!onlineOnly ? 'gradient-btn text-white' : 'bg-[#1A1A1A] text-[#8E8E93] border border-[#2C2C2E]'}`}>
            Nearby
          </button>
          {/* Online */}
          <button onClick={() => setOnlineOnly(true)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all nav-press flex-shrink-0 ${onlineOnly ? 'gradient-btn text-white' : 'bg-[#1A1A1A] text-[#8E8E93] border border-[#2C2C2E]'}`}>
            Online
          </button>
          {/* Roles toggle */}
          <button onClick={cycleRole} className={`px-3 py-1 rounded-full text-xs font-bold transition-all nav-press flex-shrink-0 ${roleFilter ? 'gradient-btn text-white' : 'bg-[#1A1A1A] text-[#8E8E93] border border-[#2C2C2E]'}`}>
            {roleFilter || 'Roles'}
          </button>

          <div className="w-px h-4 bg-[#2C2C2E] mx-1 flex-shrink-0" />

          {/* Preference badges — tappable to edit */}
          <button onClick={onViewOwnProfile} className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 nav-press ${ownProfile.preference1 === 'Safe' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {ownProfile.preference1}
          </button>
          <button onClick={onViewOwnProfile} className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 nav-press ${ownProfile.preference2 === 'Clean' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
            {ownProfile.preference2}
          </button>
          <button onClick={onViewOwnProfile} className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 nav-press ${ownProfile.preference3 === '1on1' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-orange-500/20 text-orange-400'}`}>
            {ownProfile.preference3}
          </button>
        </div>
      </div>

      {/* Profile Grid - 5 columns */}
      <div className="px-3">
        <div className="grid grid-cols-5 gap-1.5">
          {filteredUsers.map((user, i) => (
            <button
              key={user.id}
              onClick={() => user.isOwn ? onViewOwnProfile() : onViewPhoto(user)}
              className="card-enter relative aspect-[3/4] rounded-lg overflow-hidden nav-press text-left"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {user.tgPhotoUrl ? (
                <img src={user.tgPhotoUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                  <span className="text-lg font-bold text-[#8E8E93]">{user.name.charAt(0)}</span>
                </div>
              )}
              <div className="absolute inset-0 profile-photo-gradient" />
              {user.isOnline && (
                <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#00D4AA] rounded-full online-pulse" />
              )}
              <div className="absolute bottom-0 left-0 right-0 px-1 pb-1">
                <p className={`font-semibold text-[10px] leading-tight truncate ${user.isOwn ? 'text-[#FF6B35]' : 'text-white'}`}>
                  {user.isOwn ? 'You' : user.name}
                </p>
                <p className="text-[#FF6B35] text-[9px] font-medium">{formatDist(user.distance)}</p>
              </div>
            </button>
          ))}
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-[#8E8E93] text-xs">No profiles match</div>
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

// ─── Own Profile Screen ──────────────────────────────────────────────

function OwnProfileScreen({ profile, onUpdate, onBack, onShowToast }: {
  profile: UserProfile; onUpdate: (p: UserProfile) => void; onBack: () => void; onShowToast: (msg: string) => void
}) {
  const [editField, setEditField] = useState<string | null>(null)
  const [activePhotoIdx, setActivePhotoIdx] = useState(0)
  const photoScrollRef = useRef<HTMLDivElement>(null)

  const ownPhotos = profile.tgPhotos?.length ? profile.tgPhotos : (profile.tgPhotoUrl ? [profile.tgPhotoUrl] : [])

  const handlePhotoScroll = () => {
    if (!photoScrollRef.current) return
    setActivePhotoIdx(Math.round(photoScrollRef.current.scrollLeft / photoScrollRef.current.clientWidth))
  }

  const handleStatChange = (field: keyof UserProfile, value: unknown) => {
    const updated = { ...profile, [field]: value }
    onUpdate(updated)
    // Save to Telegram CloudStorage
    const tg = tgWebApp()
    if (tg?.CloudStorage) {
      const keyMap: Record<string, string> = {
        height: CLOUD_KEYS.height,
        weight: CLOUD_KEYS.weight,
        position: CLOUD_KEYS.position,
        preference1: CLOUD_KEYS.pref1,
        preference2: CLOUD_KEYS.pref2,
        preference3: CLOUD_KEYS.pref3,
      }
      const key = keyMap[field]
      if (key) tg.CloudStorage.setItem(key, String(value))
    }
  }

  const togglePref = (field: 'preference1' | 'preference2' | 'preference3', valA: string, valB: string) => {
    handleStatChange(field, profile[field] === valA ? valB : valA)
  }

  return (
    <div className="pb-20 view-enter">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#2C2C2E] px-3 py-2.5">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center nav-press">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <h2 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-white">Edit Profile</h2>
          <div className="w-8" />
        </div>
      </div>

      {/* Telegram Photo Carousel — read only, no upload */}
      <div className="px-3 pt-3">
        {ownPhotos.length > 0 ? (
          <>
            <div ref={photoScrollRef} onScroll={handlePhotoScroll} className="w-full flex overflow-x-auto snap-x snap-mandatory rounded-xl scrollbar-hide">
              {ownPhotos.map((photo, i) => (
                <div key={i} className="w-full flex-shrink-0 snap-center aspect-square relative">
                  <img src={photo} alt={`You ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-[#0088CC]/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    <span className="text-white text-[8px] font-bold uppercase">Telegram</span>
                  </div>
                </div>
              ))}
            </div>
            {ownPhotos.length > 1 && (
              <div className="flex justify-center gap-1.5 pt-2">
                {ownPhotos.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all duration-200 ${i === activePhotoIdx ? 'w-4 bg-[#FF6B35]' : 'w-1.5 bg-[#8E8E93]/40'}`} />)}
              </div>
            )}
          </>
        ) : (
          <div className="w-full aspect-square rounded-xl bg-[#1A1A1A] border-2 border-dashed border-[#2C2C2E] flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-[#8E8E93]">{profile.name.charAt(0)}</span>
          </div>
        )}
      </div>

      {/* 3 Preference Toggles */}
      <div className="px-3 pt-3">
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => togglePref('preference1', 'Safe', 'Raw')} className={`h-10 rounded-xl font-bold text-sm transition-all nav-press ${profile.preference1 === 'Safe' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>{profile.preference1 || 'Safe'}</button>
          <button onClick={() => togglePref('preference2', 'Clean', 'Party')} className={`h-10 rounded-xl font-bold text-sm transition-all nav-press ${profile.preference2 === 'Clean' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`}>{profile.preference2 || 'Clean'}</button>
          <button onClick={() => togglePref('preference3', '1on1', 'Group')} className={`h-10 rounded-xl font-bold text-sm transition-all nav-press ${profile.preference3 === '1on1' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>{profile.preference3 || '1on1'}</button>
        </div>
      </div>

      {/* Stats — no age */}
      <div className="px-3 pt-3 space-y-1.5">
        {/* Name — read-only from Telegram */}
        <div className="w-full flex items-center justify-between px-3 py-2.5 bg-[#1A1A1A] rounded-xl">
          <span className="text-xs text-[#8E8E93] font-medium uppercase">Name</span>
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">{profile.name}</span>
            <span className="text-[8px] font-bold text-[#0088CC] bg-[#0088CC]/20 px-1.5 py-0.5 rounded uppercase">TG</span>
          </div>
        </div>

        <button onClick={() => setEditField(editField === 'height' ? null : 'height')} className="w-full flex items-center justify-between px-3 py-2.5 bg-[#1A1A1A] rounded-xl text-left nav-press">
          <span className="text-xs text-[#8E8E93] font-medium uppercase">Height</span>
          <div className="flex items-center gap-1.5">
            {editField === 'height' ? (
              <input autoFocus type="number" value={profile.height} onChange={(e) => handleStatChange('height', parseInt(e.target.value) || 0)} className="bg-transparent text-white text-sm font-medium text-right outline-none w-12" onClick={(e) => e.stopPropagation()} />
            ) : (<span className="text-white text-sm font-medium">{profile.height} cm</span>)}
            <ChevronRight className={`w-3 h-3 text-[#8E8E93] transition-transform ${editField === 'height' ? 'rotate-90' : ''}`} />
          </div>
        </button>

        <button onClick={() => setEditField(editField === 'weight' ? null : 'weight')} className="w-full flex items-center justify-between px-3 py-2.5 bg-[#1A1A1A] rounded-xl text-left nav-press">
          <span className="text-xs text-[#8E8E93] font-medium uppercase">Weight</span>
          <div className="flex items-center gap-1.5">
            {editField === 'weight' ? (
              <input autoFocus type="number" value={profile.weight} onChange={(e) => handleStatChange('weight', parseInt(e.target.value) || 0)} className="bg-transparent text-white text-sm font-medium text-right outline-none w-12" onClick={(e) => e.stopPropagation()} />
            ) : (<span className="text-white text-sm font-medium">{profile.weight} kg</span>)}
            <ChevronRight className={`w-3 h-3 text-[#8E8E93] transition-transform ${editField === 'weight' ? 'rotate-90' : ''}`} />
          </div>
        </button>

        <button onClick={() => setEditField(editField === 'position' ? null : 'position')} className="w-full flex items-center justify-between px-3 py-2.5 bg-[#1A1A1A] rounded-xl text-left nav-press">
          <span className="text-xs text-[#8E8E93] font-medium uppercase">Position</span>
          <div className="flex items-center gap-1.5">
            <span className="text-white text-sm font-medium">{profile.position}</span>
            <ChevronRight className={`w-3 h-3 text-[#8E8E93] transition-transform ${editField === 'position' ? 'rotate-90' : ''}`} />
          </div>
        </button>
        {editField === 'position' && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {POSITIONS.map((pos) => (
              <button key={pos} onClick={() => { handleStatChange('position', pos); setEditField(null) }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all nav-press ${profile.position === pos ? 'gradient-btn text-white' : 'bg-[#1A1A1A] text-[#8E8E93] border border-[#2C2C2E]'}`}>{pos}</button>
            ))}
          </div>
        )}
      </div>

      {/* TON Wallet */}
      <div className="px-3 pt-3">
        <button onClick={() => onShowToast('TON Connect coming soon')} className="w-full h-10 bg-[#0088CC]/20 border border-[#0088CC]/30 text-[#0088CC] rounded-xl font-semibold text-sm nav-press flex items-center justify-center gap-2">
          <Wallet className="w-4 h-4" />Connect TON Wallet
        </button>
      </div>

      <div className="px-3 pt-3 pb-2">
        <button onClick={onBack} className="w-full h-10 gradient-btn rounded-xl text-white font-semibold text-sm nav-press flex items-center justify-center gap-2">
          <Check className="w-4 h-4" />Save
        </button>
      </div>
    </div>
  )
}

// ─── Bottom Nav ──────────────────────────────────────────────────────

function BottomNav({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const openGroupChat = () => {
    const tg = tgWebApp()
    if (tg?.openTelegramLink) tg.openTelegramLink('https://t.me/hkmembersonlychat')
    else if (tg?.openLink) tg.openLink('https://t.me/hkmembersonlychat')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-[#2C2C2E]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="max-w-[430px] mx-auto h-14 flex items-center justify-around">
        <button className="nav-press flex flex-col items-center gap-0.5 min-w-[50px] text-[#FF6B35]"><Grid3X3 className="w-5 h-5" /><span className="text-[9px] font-medium">Profiles</span></button>
        <button onClick={openGroupChat} className="nav-press flex flex-col items-center gap-0.5 min-w-[50px] text-[#FF6B35]"><Users className="w-5 h-5" /><span className="text-[9px] font-medium">Group Chat</span></button>
        <button onClick={() => onShowToast('Coming soon')} className="nav-press flex flex-col items-center gap-0.5 min-w-[50px] text-[#8E8E93]"><Compass className="w-5 h-5" /><span className="text-[9px] font-medium">Explore</span></button>
        <button onClick={() => onShowToast('TON Wallet coming soon')} className="nav-press flex flex-col items-center gap-0.5 min-w-[50px] text-[#8E8E93]"><Wallet className="w-5 h-5" /><span className="text-[9px] font-medium">Wallet</span></button>
      </div>
    </nav>
  )
}

// ─── App ─────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>('MAIN')
  const [ownProfile, setOwnProfile] = useState<UserProfile>({
    id: 'own',
    name: 'You',
    age: 0,
    height: 178,
    weight: 72,
    position: 'Versatile',
    isOnline: true,
    distance: 0,
    isOwn: true,
    preference1: 'Safe',
    preference2: 'Clean',
    preference3: '1on1',
    tgUsername: '',
    tgPhotoUrl: '',
    tgPhotos: [],
  })
  const [toast, setToast] = useState<string | null>(null)
  const [photoOverlay, setPhotoOverlay] = useState<UserProfile | null>(null)

  // ── Init Telegram + CloudStorage load ─────────────────────────────
  useEffect(() => {
    const tg = tgWebApp()
    if (!tg) return

    tg.ready()
    tg.expand()
    tg.setHeaderColor('#0A0A0A')

    const user = tg.initDataUnsafe?.user
    if (!user) return

    // Set Telegram-provided data
    setOwnProfile(prev => ({
      ...prev,
      name: user.first_name || prev.name,
      tgUsername: user.username || prev.tgUsername,
      tgPhotoUrl: user.photo_url || prev.tgPhotoUrl,
      tgPhotos: user.photo_url ? [user.photo_url] : prev.tgPhotos,
    }))

    // Load saved profile data from Telegram CloudStorage
    const keys = Object.values(CLOUD_KEYS)
    tg.CloudStorage.getItems(keys, (err, result) => {
      if (err || !result) return
      setOwnProfile(prev => ({
        ...prev,
        height: result[CLOUD_KEYS.height] ? parseInt(result[CLOUD_KEYS.height]) : prev.height,
        weight: result[CLOUD_KEYS.weight] ? parseInt(result[CLOUD_KEYS.weight]) : prev.weight,
        position: (result[CLOUD_KEYS.position] as UserProfile['position']) || prev.position,
        preference1: (result[CLOUD_KEYS.pref1] as UserProfile['preference1']) || prev.preference1,
        preference2: (result[CLOUD_KEYS.pref2] as UserProfile['preference2']) || prev.preference2,
        preference3: (result[CLOUD_KEYS.pref3] as UserProfile['preference3']) || prev.preference3,
      }))
    })
  }, [])

  const showToast = useCallback((msg: string) => setToast(msg), [])

  const handleMessage = (user: UserProfile) => {
    const tg = tgWebApp()
    if (tg?.openTelegramLink) tg.openTelegramLink(`https://t.me/${user.tgUsername || user.name.toLowerCase()}`)
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex justify-center">
      <div className="w-full max-w-[430px] bg-[#0A0A0A] min-h-screen relative">
        {view === 'MAIN' ? (
          <MainScreen
            ownProfile={ownProfile}
            users={MOCK_USERS}
            onViewOwnProfile={() => setView('OWN_PROFILE')}
            onViewPhoto={(u) => setPhotoOverlay(u)}
          />
        ) : (
          <OwnProfileScreen
            profile={ownProfile}
            onUpdate={setOwnProfile}
            onBack={() => setView('MAIN')}
            onShowToast={showToast}
          />
        )}
        <BottomNav onShowToast={showToast} />
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        {photoOverlay && (
          <PhotoOverlay user={photoOverlay} onClose={() => setPhotoOverlay(null)} onMessage={handleMessage} />
        )}
      </div>
    </div>
  )
}
