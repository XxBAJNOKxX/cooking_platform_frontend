<!-- Privát üzenetek (beszélgetéslista + chat panel + küldő input). -->

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
    const msgRes = await api.get('/messages', { params: { per_page: 100 } })
    allMessages.value = msgRes.data.data ?? []
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
      map.set(key, { partner, messages: [] })
    }
    map.get(key).messages.push(msg)
  }

  return [...map.values()]
    .map((c) => ({
      ...c,
      unread: c.messages.reduce(
        (n, m) => n + (m.sender?.id !== myId.value && m.is_read === false ? 1 : 0),
        0,
      ),
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
const externalTool = ref(null)
const toolActing = ref(false)
const toolNotice = ref('')
const showPanel = ref(false)

const activeConversation = computed(
  () => conversations.value.find((c) => c.partner.id === selectedPartnerId.value) ?? null,
)

const activePartner = computed(
  () => activeConversation.value?.partner ?? externalPartner.value ?? null,
)

// Most recent tool referenced by either side in the active conversation.
// Used to show the "context tool" header with a rent-out action for the owner.
const activeTool = computed(() => {
  const conv = activeConversation.value
  if (!conv) return externalTool.value
  for (let i = conv.messages.length - 1; i >= 0; i--) {
    const m = conv.messages[i]
    if (m.tool?.id) return m.tool
  }
  return externalTool.value
})

function selectConversation(conv) {
  selectedPartnerId.value = conv.partner.id
  externalPartner.value = null
  externalTool.value = null
  toolNotice.value = ''
  showPanel.value = true
  markConversationRead(conv)
  scrollToBottom()
}

function markConversationRead(conv) {
  if (!conv?.partner?.id) return
  if (conv.unread === 0) return

  // Optimistic local update so the badge disappears immediately.
  for (const msg of allMessages.value) {
    if (msg.sender?.id === conv.partner.id && msg.is_read === false) {
      msg.is_read = true
    }
  }

  api
    .post(`/messages/conversations/${conv.partner.id}/mark-read`)
    .then(() => {
      window.dispatchEvent(new CustomEvent('unread:refresh'))
    })
    .catch(() => {})
}

// Watch URL params on mount
onMounted(async () => {
  document.body.style.overflow = 'hidden'

  await fetchMessages()

  const urlUserIdRaw = route.query.userId
    ? parseInt(route.query.userId)
    : route.query.to
      ? parseInt(route.query.to)
      : null
  const urlToolId = route.query.toolId ? parseInt(route.query.toolId) : null

  // Guard: don't open a chat with yourself.
  const urlUserId = urlUserIdRaw && urlUserIdRaw !== myId.value ? urlUserIdRaw : null

  if (urlUserId) {
    const found = conversations.value.find((c) => c.partner.id === urlUserId)
    if (found) {
      selectConversation(found)
    } else {
      selectedPartnerId.value = urlUserId
      showPanel.value = true

      // Seed with whatever the URL gave us so the name shows immediately,
      // then always fetch so avatar_url (and the rest) fill in.
      externalPartner.value = {
        id: urlUserId,
        username: route.query.username ?? 'Betöltés...',
      }
      api
        .get(`/users/${urlUserId}`)
        .then((res) => {
          externalPartner.value = res.data.data.user
        })
        .catch(() => {
          if (!route.query.username) {
            externalPartner.value = { id: urlUserId, username: `Felhasználó #${urlUserId}` }
          }
        })
    }
  }

  if (urlToolId) {
    try {
      const res = await api.get(`/kitchen-tools/${urlToolId}`)
      const t = res.data.data
      externalTool.value = {
        id: t.id,
        name: t.name,
        image_url: t.image_url,
        is_available: t.is_available,
        is_owner: t.is_owner,
      }
    } catch {
      /* ignore missing tool */
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
  () => scrollToBottom(),
)

// ─── Send ─────────────────────────────────────────────────────────────────────

async function sendMessage(content) {
  if (!selectedPartnerId.value) return
  sendLoading.value = true
  try {
    const payload = {
      receiver_id: selectedPartnerId.value,
      content,
    }
    // If we opened the chat from a tool, pin the first message to it so
    // either participant can jump back to the listing.
    if (externalTool.value?.id && !activeConversation.value) {
      payload.tool_id = externalTool.value.id
    }
    const res = await api.post('/messages', payload)
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

async function markToolRented() {
  const tool = activeTool.value
  if (!tool?.is_owner || !selectedPartnerId.value) return
  toolActing.value = true
  try {
    const res = await api.post(`/kitchen-tools/${tool.id}/rent-out`, {
      receiver_id: selectedPartnerId.value,
    })
    allMessages.value.push(res.data.data)
    toolNotice.value = `Megjelölted "kiadva" státuszúnak: ${tool.name}`
    await scrollToBottom()
  } catch (e) {
    console.error('[markToolRented]', e)
    toolNotice.value = 'A jelölés nem sikerült.'
  } finally {
    toolActing.value = false
  }
}

async function markToolAvailable() {
  const tool = activeTool.value
  if (!tool?.is_owner) return
  toolActing.value = true
  try {
    const res = await api.post(`/kitchen-tools/${tool.id}/mark-available`, {
      receiver_id: selectedPartnerId.value,
    })
    allMessages.value.push(res.data.data)
    toolNotice.value = `${tool.name}: újra elérhető.`
    await scrollToBottom()
  } catch (e) {
    console.error('[markToolAvailable]', e)
    toolNotice.value = 'A jelölés nem sikerült.'
  } finally {
    toolActing.value = false
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
  if (diffMin < 1) return 'most'
  if (diffMin < 60) return `${diffMin} perce`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} órája`
  return d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
}

function dayLabel(str) {
  if (!str) return ''
  return parseUtc(str).toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Group messages by day and flag the last message of each "5-min cluster"
// (consecutive same-sender messages <=5min apart) so only the tail shows a
// timestamp. Everything in between is visually continuous.
const FIVE_MIN = 5 * 60_000

function groupByDay(messages) {
  const groups = []
  let lastDay = null
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    const next = messages[i + 1]
    const day = msg.sent_at?.slice(0, 10)
    if (day !== lastDay) {
      groups.push({ type: 'day', day })
      lastDay = day
    }
    const endOfCluster =
      !next ||
      next.sender?.id !== msg.sender?.id ||
      parseUtc(next.sent_at) - parseUtc(msg.sent_at) > FIVE_MIN
    groups.push({ type: 'msg', msg, showTimestamp: endOfCluster })
  }
  return groups
}
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
          @click="selectConversation(conv)"
        >
          <div class="conv-avatar">
            <img
              v-if="conv.partner.avatar_url"
              :src="conv.partner.avatar_url"
              :alt="conv.partner.username"
              class="conv-avatar-img"
            />
            <span v-else>{{ initials(conv.partner) }}</span>
            <span v-if="conv.unread > 0" class="unread-dot" aria-label="Olvasatlan üzenetek">{{
              conv.unread
            }}</span>
          </div>

          <div class="conv-info">
            <div class="conv-info-top">
              <span class="conv-name">{{ conv.partner.username }}</span>
              <span class="conv-time">{{ timeAgo(conv.messages.at(-1)?.sent_at) }}</span>
            </div>
            <p class="conv-preview">
              <span v-if="conv.messages.at(-1)?.sender?.id === myId" class="preview-mine"
                >Te:
              </span>
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
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="chat-empty-icon"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        <p>Válassz egy beszélgetést a bal oldalról</p>
      </div>

      <template v-else>
        <!-- Chat header -->
        <div class="chat-header">
          <button class="back-btn" @click="showPanel = false" aria-label="Vissza">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <RouterLink
            v-if="activePartner?.id"
            :to="{ name: 'user-profile', params: { id: activePartner.id } }"
            class="chat-partner-avatar chat-partner-link"
          >
            <img
              v-if="activePartner.avatar_url"
              :src="activePartner.avatar_url"
              :alt="activePartner.username"
              class="conv-avatar-img"
            />
            <span v-else>{{ initials(activePartner) }}</span>
          </RouterLink>
          <div v-else class="chat-partner-avatar">
            <span>{{ initials(activePartner) }}</span>
          </div>
          <RouterLink
            v-if="activePartner?.id"
            :to="{ name: 'user-profile', params: { id: activePartner.id } }"
            class="chat-partner-name chat-partner-link"
            >{{ activePartner.username }}</RouterLink
          >
          <span v-else class="chat-partner-name">{{ activePartner?.username }}</span>
        </div>

        <!-- Tool context banner -->
        <div
          v-if="activeTool"
          class="tool-banner"
          :class="{ 'tool-banner-rented': !activeTool.is_available }"
        >
          <RouterLink
            :to="{ name: 'tool-detail', params: { id: activeTool.id } }"
            class="tool-banner-link"
          >
            <img
              v-if="activeTool.image_url"
              :src="activeTool.image_url"
              :alt="activeTool.name"
              class="tool-banner-img"
            />
            <div v-else class="tool-banner-img tool-banner-img-fallback" aria-hidden="true">🧰</div>
            <div class="tool-banner-body">
              <span class="tool-banner-label">
                {{ activeTool.is_available ? 'Erről az eszközről beszéltek' : 'Jelenleg kiadva' }}
              </span>
              <span class="tool-banner-name">{{ activeTool.name }}</span>
            </div>
          </RouterLink>

          <div v-if="activeTool.is_owner" class="tool-banner-actions">
            <button
              v-if="activeTool.is_available"
              class="tool-action tool-action-primary"
              :disabled="toolActing"
              @click="markToolRented"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M20 7L9 18l-5-5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Kiadva jelölés
            </button>
            <button v-else class="tool-action" :disabled="toolActing" @click="markToolAvailable">
              Újra elérhetővé
            </button>
          </div>
        </div>

        <p v-if="toolNotice" class="tool-notice">{{ toolNotice }}</p>

        <!-- Messages -->
        <div class="messages-area">
          <template v-if="activeConversation">
            <template
              v-for="item in groupByDay(activeConversation.messages)"
              :key="item.type === 'day' ? item.day : item.msg.id"
            >
              <div v-if="item.type === 'day'" class="day-sep" aria-label="Dátum elválasztó">
                <span>{{ dayLabel(item.day + 'T12:00:00') }}</span>
              </div>
              <ChatBubble
                v-else
                :message="item.msg"
                :is-mine="item.msg.sender?.id === myId"
                :show-avatar="item.msg.sender?.id !== myId"
                :show-timestamp="item.showTimestamp"
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
  height: calc(100dvh - 8rem);
  overflow: hidden;
  background: var(--color-bg);
  border: 1.5px solid var(--color-stroke);
  border-radius: 1rem;
}

@media (max-width: 700px) {
  .messenger {
    height: calc(100vh - 6rem);
    height: calc(100dvh - 6rem);
  }
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

.conv-item:hover {
  background: color-mix(in srgb, var(--color-stroke) 40%, transparent);
}

.conv-item.active {
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

.conv-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  flex-shrink: 0;
  background: var(--color-accent);
  color: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  position: relative;
}

.conv-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 999px;
}

.unread-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  background: var(--color-danger);
  color: white;
  font-size: 0.6rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.2rem;
  border: 2px solid var(--color-surface);
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-info-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.25rem;
  margin-bottom: 0.15rem;
}

.conv-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-time {
  font-size: 0.7rem;
  color: var(--color-muted);
  flex-shrink: 0;
}

.conv-preview {
  font-size: 0.78rem;
  color: var(--color-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.preview-mine {
  color: var(--color-muted);
  font-weight: 600;
}

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
  width: 3rem;
  height: 3rem;
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
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  transition:
    background 150ms ease,
    transform 150ms var(--ease-ui-out);
}

.back-btn svg {
  width: 1rem;
  height: 1rem;
}

.back-btn:active {
  transform: scale(0.92);
}

.chat-partner-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 800;
  overflow: hidden;
  flex-shrink: 0;
}

.chat-partner-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.chat-partner-link {
  text-decoration: none;
  color: inherit;
  transition:
    color 150ms var(--ease-ui-out),
    opacity 150ms var(--ease-ui-out);
}

.chat-partner-name.chat-partner-link:hover {
  color: var(--color-accent);
}

.chat-partner-avatar.chat-partner-link {
  cursor: pointer;
  color: #ffffff;
}

.chat-partner-avatar.chat-partner-link:hover {
  opacity: 0.85;
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

/* ── Tool context banner ── */
.tool-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem 0.55rem 0.55rem;
  margin: 0.6rem 0.75rem 0;
  border: 1.5px solid color-mix(in srgb, var(--color-accent) 22%, transparent);
  background: color-mix(in srgb, var(--color-accent) 7%, var(--color-bg));
  border-radius: 0.875rem;
  animation: toolBannerIn 240ms var(--ease-ui-out) both;
}

@keyframes toolBannerIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

.tool-banner-rented {
  border-color: color-mix(in srgb, #2f1e17 25%, transparent);
  background: color-mix(in srgb, #2f1e17 6%, var(--color-bg));
}

.tool-banner-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex: 1;
  min-width: 0;
  text-decoration: none;
  color: var(--color-text);
  transition: opacity 150ms var(--ease-ui-out);
}

.tool-banner-link:hover {
  opacity: 0.85;
}

.tool-banner-img {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.55rem;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid var(--color-stroke);
}

.tool-banner-img-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  font-size: 1rem;
}

.tool-banner-body {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 0;
  flex: 1;
}

.tool-banner-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.tool-banner-name {
  font-size: 0.88rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tool-banner-actions {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
}

.tool-action {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 150ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out),
    border-color 150ms var(--ease-ui-out);
}

.tool-action:hover {
  background: var(--color-surface);
}

.tool-action:active {
  transform: scale(0.96);
}

.tool-action:disabled {
  opacity: 0.55;
  cursor: wait;
}

.tool-action svg {
  width: 0.85rem;
  height: 0.85rem;
}

.tool-action-primary {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-bg);
}

.tool-action-primary:hover {
  background: var(--color-accent-hover);
}

.tool-notice {
  margin: 0.4rem 0.85rem 0;
  font-size: 0.78rem;
  color: var(--color-accent);
  animation: toolBannerIn 240ms var(--ease-ui-out) both;
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
  .conv-sidebar {
    width: 100%;
    border-right: none;
  }

  .chat-panel {
    width: 100%;
  }

  .back-btn {
    display: flex;
  }

  .hidden-mobile {
    display: none;
  }
}
</style>
