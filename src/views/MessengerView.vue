<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import ChatBubble from '@/components/messenger/ChatBubble.vue'
import MessageInput from '@/components/messenger/MessageInput.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const route = useRoute()
const authStore = useAuthStore()
const myId = computed(() => authStore.user?.id)

// ─── Data ─────────────────────────────────────────────────────────────────────

const allMessages = ref([])
const loading = ref(true)
const sendLoading = ref(false)
const messagesEnd = ref(null)

async function fetchMessages() {
  try {
    const res = await api.get('/messages', { params: { per_page: 100 } })
    allMessages.value = res.data.data ?? []
  } catch {
    // silent on poll errors
  } finally {
    loading.value = false
  }
}

// ─── Conversations ────────────────────────────────────────────────────────────

const conversations = computed(() => {
  const map = new Map()

  for (const msg of allMessages.value) {
    const partner = msg.sender.id === myId.value ? msg.receiver : msg.sender
    if (!partner) continue
    const key = partner.id

    if (!map.has(key)) {
      map.set(key, { partner, messages: [], unread: 0 })
    }
    const conv = map.get(key)
    conv.messages.push(msg)
    if (!msg.is_read && msg.receiver?.id === myId.value) conv.unread++
  }

  return [...map.values()]
    .map(c => ({
      ...c,
      messages: [...c.messages].sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at)),
    }))
    .sort((a, b) => {
      const la = a.messages.at(-1)?.sent_at ?? ''
      const lb = b.messages.at(-1)?.sent_at ?? ''
      return lb.localeCompare(la)
    })
})

// ─── Selection ────────────────────────────────────────────────────────────────

const selectedPartnerId = ref(null)
const externalPartner = ref(null)

const activeConversation = computed(() =>
  conversations.value.find(c => c.partner.id === selectedPartnerId.value) ?? null
)

const activePartner = computed(() =>
  activeConversation.value?.partner ?? externalPartner.value ?? null
)

function selectConversation(conv) {
  selectedPartnerId.value = conv.partner.id
  externalPartner.value = null
  markConversationRead(conv)
  scrollToBottom()
}

function markConversationRead(conv) {
  conv.messages.forEach(msg => {
    if (!msg.is_read && msg.receiver?.id === myId.value) {
      msg.is_read = true
      api.put(`/messages/${msg.id}`, { is_read: true }).catch(() => {})
    }
  })
}

// Watch URL params on mount
onMounted(async () => {
  document.body.style.overflow = 'hidden'

  await fetchMessages()

  const urlUserId = route.query.userId ? parseInt(route.query.userId) : null
  if (urlUserId) {
    const found = conversations.value.find(c => c.partner.id === urlUserId)
    if (found) {
      selectConversation(found)
    } else {
      selectedPartnerId.value = urlUserId
      externalPartner.value = {
        id: urlUserId,
        username: route.query.username ?? `Felhasználó #${urlUserId}`,
      }
    }
  }
})

// ─── Auto-scroll ──────────────────────────────────────────────────────────────

async function scrollToBottom() {
  await nextTick()
  messagesEnd.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
}

watch(
  () => activeConversation.value?.messages.length,
  () => scrollToBottom()
)

// ─── Send ─────────────────────────────────────────────────────────────────────

async function sendMessage(content) {
  if (!selectedPartnerId.value) return
  sendLoading.value = true
  try {
    const res = await api.post('/messages', {
      receiver_id: selectedPartnerId.value,
      content,
    })
    const newMsg = res.data.data
    allMessages.value.push(newMsg)
    if (externalPartner.value) externalPartner.value = null
    await scrollToBottom()
  } catch {
    // TODO: toast error
  } finally {
    sendLoading.value = false
  }
}

// ─── Polling (10 s) ──────────────────────────────────────────────────────────

let pollTimer = null

onMounted(() => {
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible') fetchMessages()
  }, 10_000)
})

onUnmounted(() => {
  clearInterval(pollTimer)
  document.body.style.overflow = ''
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(user) {
  return (user?.username ?? '?').slice(0, 2).toUpperCase()
}

function parseUtc(str) {
  if (!str) return new Date(NaN)
  return new Date(str.includes('T') ? str : str.replace(' ', 'T') + 'Z')
}

function timeAgo(str) {
  if (!str) return ''
  const d = parseUtc(str)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1)  return 'most'
  if (diffMin < 60) return `${diffMin} perce`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24)  return `${diffH} órája`
  return d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
}

function dayLabel(str) {
  if (!str) return ''
  return parseUtc(str).toLocaleDateString('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function groupByDay(messages) {
  const groups = []
  let lastDay = null
  for (const msg of messages) {
    const day = msg.sent_at?.slice(0, 10)
    if (day !== lastDay) {
      groups.push({ type: 'day', day })
      lastDay = day
    }
    groups.push({ type: 'msg', msg })
  }
  return groups
}

const showPanel = ref(false)
</script>

<template>
  <div class="messenger">

    <!-- ── Left: conversation list ─────────────────────────────── -->
    <div class="conv-sidebar" :class="{ 'hidden-mobile': showPanel }">
      <div class="sidebar-header">
        <h1 class="sidebar-title">Üzenetek</h1>
      </div>

      <div v-if="loading" class="sidebar-loading">
        <LoadingSpinner size="h-5 w-5" />
      </div>

      <div v-else-if="conversations.length === 0" class="sidebar-empty">
        <p>Még nincs üzeneted.</p>
      </div>

      <div v-else class="conv-list">
        <button
          v-for="conv in conversations"
          :key="conv.partner.id"
          class="conv-item"
          :class="{ active: conv.partner.id === selectedPartnerId }"
          @click="selectConversation(conv); showPanel = true"
        >
          <div class="conv-avatar">
            <img v-if="conv.partner.avatar_url" :src="conv.partner.avatar_url" :alt="conv.partner.username" class="conv-avatar-img"/>
            <span v-else>{{ initials(conv.partner) }}</span>
            <span v-if="conv.unread > 0" class="unread-dot" aria-label="Olvasatlan üzenetek">{{ conv.unread }}</span>
          </div>

          <div class="conv-info">
            <div class="conv-info-top">
              <span class="conv-name">{{ conv.partner.username }}</span>
              <span class="conv-time">{{ timeAgo(conv.messages.at(-1)?.sent_at) }}</span>
            </div>
            <p class="conv-preview">
              <span v-if="conv.messages.at(-1)?.sender?.id === myId" class="preview-mine">Te: </span>
              {{ conv.messages.at(-1)?.content }}
            </p>
          </div>
        </button>
      </div>
    </div>

    <!-- ── Right: active conversation ────────────────────────────  -->
    <div class="chat-panel" :class="{ 'hidden-mobile': !showPanel }">

      <!-- Empty state: no conversation selected -->
      <div v-if="!selectedPartnerId" class="chat-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="chat-empty-icon" aria-hidden="true">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <p>Válassz egy beszélgetést a bal oldalról</p>
      </div>

      <template v-else>
        <!-- Chat header -->
        <div class="chat-header">
          <button class="back-btn" @click="showPanel = false" aria-label="Vissza">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <div class="chat-partner-avatar">
            <img v-if="activePartner?.avatar_url" :src="activePartner.avatar_url" :alt="activePartner.username" class="conv-avatar-img"/>
            <span v-else>{{ initials(activePartner) }}</span>
          </div>
          <span class="chat-partner-name">{{ activePartner?.username }}</span>
        </div>

        <!-- Messages -->
        <div class="messages-area">
          <template v-if="activeConversation">
            <template v-for="item in groupByDay(activeConversation.messages)" :key="item.type === 'day' ? item.day : item.msg.id">
              <div v-if="item.type === 'day'" class="day-sep" aria-label="Dátum elválasztó">
                <span>{{ dayLabel(item.day + 'T12:00:00') }}</span>
              </div>
              <ChatBubble
                v-else
                :message="item.msg"
                :is-mine="item.msg.sender?.id === myId"
                :show-avatar="item.msg.sender?.id !== myId"
              />
            </template>
          </template>

          <div v-else-if="externalPartner" class="new-conv-hint">
            <p>Kezdj el üzenetet írni {{ externalPartner.username }}-nak.</p>
          </div>

          <div ref="messagesEnd" aria-hidden="true" />
        </div>

        <!-- Input -->
        <MessageInput :disabled="sendLoading" @send="sendMessage" />
      </template>
    </div>

  </div>
</template>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────── */
.messenger {
  display: flex;
  height: calc(100vh - 8rem);
  overflow: hidden;
  background: var(--color-bg);
  border: 1.5px solid var(--color-stroke);
  border-radius: 1rem;
}

/* ── Sidebar ─────────────────────────────────────────────────────── */
.conv-sidebar {
  width: 300px;
  flex-shrink: 0;
  border-right: 1.5px solid var(--color-stroke);
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  overflow-y: auto;
}

.sidebar-header {
  padding: 1.25rem 1rem 0.875rem;
  border-bottom: 1px solid var(--color-stroke);
}

.sidebar-title {
  font-size: 1.125rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--color-text);
}

.sidebar-loading,
.sidebar-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-muted);
  padding: 1rem;
}

.conv-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.375rem 0;
}

/* ── Conversation item ── */
.conv-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 150ms ease;
}

.conv-item:hover { background: color-mix(in srgb, var(--color-stroke) 40%, transparent); }
.conv-item.active { background: color-mix(in srgb, var(--color-accent) 10%, transparent); }

.conv-avatar {
  width: 2.5rem; height: 2.5rem;
  border-radius: 999px;
  flex-shrink: 0;
  background: var(--color-accent);
  color: var(--color-bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 800;
  position: relative;
}

.conv-avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 999px; }

.unread-dot {
  position: absolute; top: -2px; right: -2px;
  min-width: 1.1rem; height: 1.1rem;
  border-radius: 999px;
  background: var(--color-danger);
  color: white;
  font-size: 0.6rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  padding: 0 0.2rem;
  border: 2px solid var(--color-surface);
}

.conv-info { flex: 1; min-width: 0; }

.conv-info-top {
  display: flex; align-items: baseline;
  justify-content: space-between;
  gap: 0.25rem;
  margin-bottom: 0.15rem;
}

.conv-name {
  font-size: 0.875rem; font-weight: 700;
  color: var(--color-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.conv-time {
  font-size: 0.7rem; color: var(--color-muted);
  flex-shrink: 0;
}

.conv-preview {
  font-size: 0.78rem; color: var(--color-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin: 0;
}

.preview-mine { color: var(--color-muted); font-weight: 600; }

/* ── Chat panel ─────────────────────────────────────────────────── */
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.chat-empty-icon {
  width: 3rem; height: 3rem;
  opacity: 0.35;
}

/* ── Chat header ── */
.chat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-bottom: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  flex-shrink: 0;
}

.back-btn {
  display: none;
  align-items: center; justify-content: center;
  width: 2rem; height: 2rem;
  border-radius: 0.5rem;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  transition: background 150ms ease, transform 150ms var(--ease-ui-out);
}
.back-btn svg { width: 1rem; height: 1rem; }
.back-btn:active { transform: scale(0.92); }

.chat-partner-avatar {
  width: 2.25rem; height: 2.25rem;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; font-weight: 800;
  overflow: hidden;
  flex-shrink: 0;
}

.chat-partner-name {
  font-size: 1rem; font-weight: 700;
  color: var(--color-text);
}

/* ── Messages area ── */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  scroll-behavior: smooth;
}

/* ── Day separator ── */
.day-sep {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.75rem 0;
}

.day-sep span {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-muted);
  background: var(--color-bg);
  padding: 0.2rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--color-stroke);
}

.new-conv-hint {
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-muted);
  padding: 2rem;
}

/* ── Mobile ─────────────────────────────────────────────────────── */
@media (max-width: 700px) {
  .conv-sidebar { width: 100%; border-right: none; }
  .chat-panel   { width: 100%; }
  .back-btn { display: flex; }

  .hidden-mobile { display: none; }
}
</style>
