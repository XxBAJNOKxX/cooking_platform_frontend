// OSM Nominatim-based geocoding service.
// No API key needed. Respects Nominatim usage policy:
// - Identify the app via a descriptive User-Agent isn't possible from browser,
//   but we keep request volume low (debounced) and provide `email` param.
// - Max 1 req/sec per client — debouncing on the caller side.

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const CONTACT_EMAIL = 'cooking-platform@example.com'

function normalizeHit(hit) {
  const a = hit.address ?? {}

  // Nominatim returns many keys for cities (city, town, village, hamlet).
  const city =
    a.city ?? a.town ?? a.village ?? a.hamlet ?? a.municipality ?? ''

  // Prefer county (megye) but fall back to state if county isn't present.
  const county = a.county ?? a.state ?? ''

  const country = a.country ?? ''
  const postalCode = a.postcode ?? ''
  const street = a.road ?? a.pedestrian ?? a.cycleway ?? a.path ?? ''
  const houseNumber = a.house_number ?? ''

  return {
    osmId: `${hit.osm_type}/${hit.osm_id}`,
    displayName: hit.display_name,
    lat: parseFloat(hit.lat),
    lng: parseFloat(hit.lon),
    country,
    county,
    city,
    postalCode,
    street,
    houseNumber,
  }
}

/**
 * Search for address matches.
 * @param {string} query
 * @param {object} [opts]
 * @param {string} [opts.countryCodes='hu']
 * @param {number} [opts.limit=6]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<Array<{osmId, displayName, lat, lng, country, county, city, postalCode, street, houseNumber}>>}
 */
export async function searchAddress(query, opts = {}) {
  const trimmed = (query ?? '').trim()
  if (trimmed.length < 3) return []

  const params = new URLSearchParams({
    q: trimmed,
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(opts.limit ?? 6),
    countrycodes: opts.countryCodes ?? 'hu',
    'accept-language': 'hu',
    email: CONTACT_EMAIL,
  })

  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    signal: opts.signal,
    headers: { 'Accept': 'application/json' },
  })
  if (!res.ok) throw new Error(`Nominatim error ${res.status}`)

  const data = await res.json()
  return Array.isArray(data) ? data.map(normalizeHit) : []
}

/**
 * Debounce a function with AbortController-aware cancellation.
 * @template T
 * @param {(signal: AbortSignal, ...args: any[]) => Promise<T>} fn
 * @param {number} ms
 */
export function debounceCancellable(fn, ms = 300) {
  let timer = null
  let controller = null

  const wrapped = (...args) =>
    new Promise((resolve, reject) => {
      if (timer) clearTimeout(timer)
      if (controller) controller.abort()

      controller = new AbortController()
      const signal = controller.signal

      timer = setTimeout(() => {
        fn(signal, ...args).then(resolve, err => {
          if (err?.name === 'AbortError') resolve(null)
          else reject(err)
        })
      }, ms)
    })

  wrapped.cancel = () => {
    if (timer) clearTimeout(timer)
    if (controller) controller.abort()
  }

  return wrapped
}
