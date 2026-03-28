const CATEGORY_ICONS: Record<string, string> = {
  restaurant: '🍴',
  cafe:       '☕',
  gym:        '🏋️',
  library:    '📚',
  university: '🏛️',
  bar:        '🍺',
  retail:     '🛍️',
  general:    '📍',
}

interface PlaceMarkerProps {
  category: string
  name: string
  onClick?: () => void
}

export default function PlaceMarker({ category, name, onClick }: PlaceMarkerProps) {
  const icon = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.general

  return (
    <div
      className="flex flex-col items-center cursor-pointer"
      onClick={onClick}
      style={{ animation: 'placeFloat 2s ease-in-out infinite' }}
    >
      <style>{`
        @keyframes placeFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
      `}</style>

      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: '#8B5CF6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          boxShadow: '0 4px 12px rgba(139,92,246,0.5)',
        }}
      >
        {icon}
      </div>

      <div
        className="mt-1 font-bold text-white text-center"
        style={{
          fontSize: 10,
          textShadow: '0 1px 4px rgba(0,0,0,0.9)',
          maxWidth: 80,
          lineHeight: 1.2,
        }}
      >
        {name}
      </div>
    </div>
  )
}
