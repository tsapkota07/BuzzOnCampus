export const UNIVERSITY_COORDS: Record<string, { lat: number; lng: number; name: string; radiusM: number }> = {
  kent:        { lat: 41.1534, lng: -81.3579, name: 'Kent State University',       radiusM: 8047 },
  youngstown:  { lat: 41.1006, lng: -80.6481, name: 'Youngstown State University', radiusM: 8047 },
  ysu:         { lat: 41.1006, lng: -80.6481, name: 'Youngstown State University', radiusM: 8047 },
  ohio:        { lat: 40.0067, lng: -83.0305, name: 'Ohio State University',        radiusM: 8047 },
  osu:         { lat: 40.0067, lng: -83.0305, name: 'Ohio State University',        radiusM: 8047 },
  general:     { lat: 41.1006, lng: -80.6481, name: 'your campus',                 radiusM: Infinity },
  other:       { lat: 41.1006, lng: -80.6481, name: 'your campus',                 radiusM: Infinity },
}

export function getUniversityCoords(university_id: string): { lat: number; lng: number; name: string; radiusM: number } {
  return UNIVERSITY_COORDS[university_id] ?? UNIVERSITY_COORDS.other
}

/** Returns true if this university_id has a campus radius restriction. */
export function isRestrictedAccount(university_id: string): boolean {
  const entry = UNIVERSITY_COORDS[university_id]
  return entry !== undefined && entry.radiusM !== Infinity
}

/** Returns true if the coords are within the campus radius, or if the account is unrestricted. */
export function isWithinCampus(lat: number, lng: number, university_id: string): boolean {
  if (!isRestrictedAccount(university_id)) return true
  const { lat: uLat, lng: uLng, radiusM } = getUniversityCoords(university_id)
  const R = 6371000
  const dLat = (lat - uLat) * Math.PI / 180
  const dLng = (lng - uLng) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(uLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return distance <= radiusM
}
