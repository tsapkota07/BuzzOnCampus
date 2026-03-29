import { useMapStore } from '../../store/useMapStore'
import type { MockPlacePost } from '../../store/useMapStore'

const PIN_COLORS: Record<string, string> = {
  event: '#3B82F6',
  volunteer: '#22C55E',
  help: '#F59E0B',
}

const PIN_LABELS: Record<string, string> = {
  event: 'EVENT',
  volunteer: 'VOLUNTEER',
  help: 'HELP',
}

function DealCard({ post }: { post: MockPlacePost }) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: '#0f0f1a', borderLeft: '3px solid #F59E0B' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded" style={{ background: '#F59E0B22', color: '#F59E0B' }}>
          ⚡ FLASH DEAL
        </span>
        <span className="text-xs" style={{ color: '#888' }}>Ends in {post.expiresIn}</span>
      </div>
      <p className="text-white font-bold text-sm mb-1">{post.title}</p>
      {post.body && <p className="text-sm mb-3" style={{ color: '#aaa' }}>{post.body}</p>}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold" style={{ color: '#fd8b00' }}>🪙 {post.buzzCost} Buzz to redeem</span>
      </div>
      <button
        className="w-full py-2.5 rounded-lg font-bold text-white text-sm"
        style={{ background: 'linear-gradient(135deg, #F59E0B, #d97706)' }}
      >
        REDEEM NOW
      </button>
    </div>
  )
}

function EventCard({ post }: { post: MockPlacePost }) {
  const [month, day] = (post.eventDate ?? 'Oct 1').split(' ')
  return (
    <div className="rounded-xl p-4 mb-3 flex gap-3" style={{ background: '#0f0f1a', borderLeft: '3px solid #3B82F6' }}>
      <div className="flex flex-col items-center justify-center rounded-lg px-3 py-2 shrink-0"
        style={{ background: '#3B82F622' }}>
        <span className="text-xs font-bold uppercase" style={{ color: '#3B82F6' }}>{month}</span>
        <span className="text-2xl font-extrabold text-white leading-none">{day}</span>
      </div>
      <div className="flex-1">
        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded mb-1 inline-block"
          style={{ background: '#3B82F622', color: '#3B82F6' }}>LIVE EVENT</span>
        <p className="text-white font-bold text-sm">{post.title}</p>
        {post.body && <p className="text-xs mt-1" style={{ color: '#aaa' }}>{post.body}</p>}
      </div>
    </div>
  )
}

function AnnouncementCard({ post }: { post: MockPlacePost }) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: '#0f0f1a' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📢</span>
        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded"
          style={{ background: '#ffffff15', color: '#aaa' }}>CAMPUS UPDATE</span>
      </div>
      <p className="text-white font-bold text-sm">{post.title}</p>
    </div>
  )
}

function ReviewCard({ post }: { post: MockPlacePost }) {
  const stars = post.rating ?? 0
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: '#0f0f1a' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: '#fd8b00' }}>
          {post.username?.[0] ?? 'U'}
        </div>
        <span className="text-sm font-semibold text-white">{post.username}</span>
        <span className="ml-auto text-yellow-400 text-sm">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
      </div>
      {post.body && <p className="text-sm italic" style={{ color: '#ccc' }}>"{post.body}"</p>}
    </div>
  )
}

function PostCard({ post }: { post: MockPlacePost }) {
  if (post.type === 'deal') return <DealCard post={post} />
  if (post.type === 'event') return <EventCard post={post} />
  if (post.type === 'announcement') return <AnnouncementCard post={post} />
  if (post.type === 'review') return <ReviewCard post={post} />
  return null
}

export default function DetailPanel() {
  const { selectedPin, selectedPlace, setSelectedPin, setSelectedPlace } = useMapStore()

  const isOpen = selectedPin !== null || selectedPlace !== null

  const close = () => {
    setSelectedPin(null)
    setSelectedPlace(null)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 120,
        right: 0,
        bottom: 0,
        width: 360,
        background: '#1a1a2e',
        zIndex: 100,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 300ms ease-out',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
        borderTopLeftRadius: 16,
        overflowY: 'auto',
      }}
    >
      {/* Close button */}
      <button
        onClick={close}
        className="absolute top-3 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white z-10"
        style={{ background: 'rgba(255,255,255,0.1)' }}
      >
        ✕
      </button>

      {/* PIN CONTENT */}
      {selectedPin && (
        <div className="flex flex-col h-full p-6">
          {/* Type badge */}
          <div className="mb-4 mt-2">
            <span
              className="text-xs font-bold uppercase px-3 py-1 rounded-full text-white"
              style={{ background: PIN_COLORS[selectedPin.type] }}
            >
              {PIN_LABELS[selectedPin.type]}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-white font-extrabold text-xl mb-2">{selectedPin.title}</h2>

          {/* Username */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-4 h-4 rounded-full"
              style={{ background: selectedPin.userColor }}
            />
            <span className="text-sm font-semibold" style={{ color: '#aaa' }}>
              @{selectedPin.username} · {selectedPin.createdAt}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#ccc' }}>
            {selectedPin.description}
          </p>

          {/* Buzz reward */}
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ background: '#0f0f1a' }}>
            <span className="text-xl">🪙</span>
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: '#888' }}>Buzz Reward</p>
              <p className="font-extrabold text-lg" style={{ color: '#fd8b00' }}>
                {selectedPin.buzzReward} Buzz Points
              </p>
            </div>
          </div>

          <div className="h-px mb-4" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* Participant count */}
          <p className="text-sm mb-6" style={{ color: '#aaa' }}>
            👥 {selectedPin.participantCount} {selectedPin.participantCount === 1 ? 'person' : 'people'} joined
          </p>

          {/* Action button */}
          <div className="mt-auto">
            <button
              className="w-full py-3.5 rounded-xl font-bold text-white text-base"
              style={{ background: 'linear-gradient(135deg, #fd8b00, #8c4a00)' }}
            >
              {selectedPin.type === 'help' ? 'Accept & Help' : 'Join'}
            </button>
          </div>
        </div>
      )}

      {/* PLACE CONTENT */}
      {selectedPlace && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="mt-2 mb-2">
              <span className="text-xs font-bold uppercase px-3 py-1 rounded-full text-white"
                style={{ background: '#8B5CF6' }}>
                {selectedPlace.category}
              </span>
            </div>
            <h2 className="text-white font-extrabold text-xl mt-3 mb-1">{selectedPlace.name}</h2>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#fd8b00' }}>
              ● ACTIVE HUB
            </p>
          </div>

          {/* Posts list — scrollable */}
          <div className="flex-1 overflow-y-auto p-6 pb-24">
            {selectedPlace.posts.length === 0 ? (
              <p className="text-center text-sm mt-8" style={{ color: '#888' }}>
                No posts yet. Be the first to post here!
              </p>
            ) : (
              selectedPlace.posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>

          {/* POST HERE button — fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4"
            style={{ background: 'linear-gradient(to top, #1a1a2e 80%, transparent)' }}>
            <button
              className="w-full py-3.5 rounded-xl font-bold text-white text-base"
              style={{ background: 'linear-gradient(135deg, #fd8b00, #8c4a00)' }}
            >
              + POST HERE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}