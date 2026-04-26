<!-- Leaflet térkép az eszköz elhelyezkedésének megjelenítésére. -->

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  // Kör középpontja (GPS koordináta)
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  // Sugár méterben; 0 esetén pontos marker, nem kör
  radiusM: { type: Number, default: 700 },
  // Tooltip szöveg a kör/marker hover-re
  label: { type: String, default: '' },
  // További eszközök körökként megjelenítve a térképen ({ id, lat, lng, radius_m, name })
  markers: { type: Array, default: () => [] },
  zoom: { type: Number, default: 13 },
  interactive: { type: Boolean, default: true },
})

const emit = defineEmits(['marker-click'])

const mapEl = ref(null)
let map = null
let primaryLayer = null
let markerGroup = null

function makeCircle(lat, lng, radius) {
  return L.circle([lat, lng], {
    radius,
    color: '#e9692c',
    weight: 2,
    fillColor: '#e9692c',
    fillOpacity: 0.18,
  })
}

function makeMarker(lat, lng) {
  return L.marker([lat, lng], {
    icon: L.divIcon({
      className: 'tmap-pin',
      html: '<span class="tmap-pin-dot"></span>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    }),
  })
}

function renderPrimary() {
  if (!map) return
  if (primaryLayer) {
    primaryLayer.remove()
    primaryLayer = null
  }
  primaryLayer =
    props.radiusM > 0
      ? makeCircle(props.lat, props.lng, props.radiusM)
      : makeMarker(props.lat, props.lng)

  primaryLayer.addTo(map)
  if (props.label) primaryLayer.bindTooltip(props.label, { direction: 'top', offset: [0, -6] })
}

function renderSecondary() {
  if (!map) return
  if (markerGroup) {
    markerGroup.remove()
    markerGroup = null
  }
  if (!props.markers.length) return

  markerGroup = L.layerGroup().addTo(map)
  for (const m of props.markers) {
    const layer = m.radius_m > 0 ? makeCircle(m.lat, m.lng, m.radius_m) : makeMarker(m.lat, m.lng)
    if (m.name) layer.bindTooltip(m.name, { direction: 'top', offset: [0, -6] })
    layer.on('click', () => emit('marker-click', m))
    layer.addTo(markerGroup)
  }
}

onMounted(() => {
  map = L.map(mapEl.value, {
    center: [props.lat, props.lng],
    zoom: props.zoom,
    zoomControl: props.interactive,
    dragging: props.interactive,
    scrollWheelZoom: props.interactive,
    doubleClickZoom: props.interactive,
    boxZoom: props.interactive,
    keyboard: props.interactive,
    touchZoom: props.interactive,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    maxZoom: 19,
  }).addTo(map)

  renderPrimary()
  renderSecondary()

  // Térkép bounds-jának igazítása az extra markerekhez
  if (props.markers.length) {
    const all = [[props.lat, props.lng], ...props.markers.map((m) => [m.lat, m.lng])]
    map.fitBounds(all, { padding: [30, 30], maxZoom: 14 })
  }
})

watch(
  () => [props.lat, props.lng, props.radiusM, props.label],
  () => {
    renderPrimary()
    if (map) map.setView([props.lat, props.lng], props.zoom)
  },
)

watch(
  () => props.markers,
  () => {
    renderSecondary()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="tmap-outer">
    <div ref="mapEl" class="tmap" />
    <p class="tmap-note">A pontos cím bérlés egyeztetése után derül ki.</p>
  </div>
</template>

<style scoped>
.tmap-outer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tmap {
  width: 100%;
  height: 100%;
  min-height: 18rem;
  border-radius: 1rem;
  overflow: hidden;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-surface);
}

.tmap-note {
  margin: 0;
  font-size: 0.72rem;
  color: var(--color-muted);
  text-align: center;
  opacity: 0.75;
}
</style>

<style>
/* Nem scoped: Leaflet a komponens gyökerén kívülre rendereli a marker DOM-ot */
.tmap-pin {
  pointer-events: auto;
}
.tmap-pin-dot {
  display: block;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #e9692c;
  border: 3px solid #fff;
  box-shadow: 0 4px 10px -2px rgba(47, 30, 23, 0.35);
  transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tmap-pin:hover .tmap-pin-dot {
  transform: scale(1.12);
}

.leaflet-container {
  font-family: inherit;
}
</style>
