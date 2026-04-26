// OSM Nominatim alapú cím-geokódolás — nincs szükség kulcsra, debounce-szal és kapcsolattartó email-mel követjük a usage policy-t

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const CONTACT_EMAIL = 'cooking-platform@example.com'

// Nominatim találat normalizálása egységes mezőszerkezetre
function normalizeHit(hit) {
  const a = hit.address ?? {}

  // Nominatim sokféle kulcsot ad a városra
  const city = a.city ?? a.town ?? a.village ?? a.hamlet ?? a.municipality ?? ''

  // Megyét részesítjük előnyben, fallback a state
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

// Cím keresése Nominatim-ban; üres / 3 karakternél rövidebb keresésre üres tömböt ad
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
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Nominatim error ${res.status}`)

  const data = await res.json()
  return Array.isArray(data) ? data.map(normalizeHit) : []
}

// Debounce + AbortController; a futó kérést megszakítja, ha új hívás érkezik
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
        fn(signal, ...args).then(resolve, (err) => {
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
