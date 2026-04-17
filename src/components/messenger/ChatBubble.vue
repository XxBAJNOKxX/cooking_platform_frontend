<script setup>
import { computed } from 'vue'

const props = defineProps({
  message:    { type: Object, required: true },
  isMine:     { type: Boolean, default: false },
  showAvatar: { type: Boolean, default: false },
})

const isSystem = computed(() => props.message?.type === 'system')

function timeLabel(str) {
  if (!str) return ''
  const d = new Date(str.includes('T') ? str : str.replace(' ', 'T') + 'Z')
  return d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
}

function initials(user) {
  return (user?.username ?? '?').slice(0, 2).toUpperCase()
}
</script>

<template>
  <!-- System message (e.g. tool rented/released) -->
  <div v-if="isSystem" class="sys-row">
    <div class="sys-bubble">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="sys-ico" aria-hidden="true">
        <path d="M20 7L9 18l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>{{ message.content }}</span>
      <span class="sys-time">{{ timeLabel(message.sent_at) }}</span>
    </div>
  </div>

  <!-- Normal chat bubble -->
  <div v-else class="bubble-row" :class="{ mine: isMine }">
    <div v-if="!isMine && showAvatar" class="avatar" aria-hidden="true">
      <img v-if="message.sender?.avatar_url" :src="message.sender.avatar_url" :alt="message.sender.username" class="avatar-img" />
      <span v-else>{{ initials(message.sender) }}</span>
    </div>
    <div v-else-if="!isMine" class="avatar-placeholder" aria-hidden="true" />

    <div class="bubble-wrap">
      <div class="bubble" :class="{ 'bubble-mine': isMine, 'bubble-theirs': !isMine }">
        <RouterLink
          v-if="message.tool && message.tool.id"
          :to="{ name: 'tool-detail', params: { id: message.tool.id } }"
          class="tool-pill"
          :class="{ 'tool-pill-mine': isMine }"
        >
          <img v-if="message.tool.image_url" :src="message.tool.image_url" :alt="message.tool.name" class="tool-pill-img" />
          <span class="tool-pill-body">
            <span class="tool-pill-label">Eszköz</span>
            <span class="tool-pill-name">{{ message.tool.name ?? 'Eszköz' }}</span>
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="tool-pill-arrow" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </RouterLink>
        <div class="bubble-text">{{ message.content }}</div>
      </div>
      <span class="time" :class="{ 'time-mine': isMine }">{{ timeLabel(message.sent_at) }}</span>
    </div>
  </div>
</template>

<style scoped>
.bubble-row {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  max-width: 72%;
  animation: bubbleIn 200ms var(--ease-ui-out) both;
}

@keyframes bubbleIn {
  from { opacity: 0; transform: translateY(6px) scale(0.97); }
  to   { opacity: 1; transform: none; }
}

.bubble-row.mine {
  align-self: flex-end;
  flex-direction: row-reverse;
}

/* ── Avatar ── */
.avatar,
.avatar-placeholder {
  width: 1.875rem;
  height: 1.875rem;
  flex-shrink: 0;
}

.avatar {
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.625rem; font-weight: 800;
  overflow: hidden;
}

.avatar-img { width: 100%; height: 100%; object-fit: cover; }

/* ── Bubble ── */
.bubble-wrap { display: flex; flex-direction: column; gap: 0.2rem; max-width: 100%; }

.bubble-row.mine .bubble-wrap { align-items: flex-end; }

.bubble {
  padding: 0.6rem 0.875rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  line-height: 1.5;
  max-width: 100%;
  transition: transform 150ms var(--ease-ui-out);
}

.bubble-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.bubble-mine {
  background: var(--color-accent);
  color: var(--color-bg);
  border-bottom-right-radius: 0.25rem;
}

.bubble-theirs {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-stroke);
  border-bottom-left-radius: 0.25rem;
}

/* ── Tool pill ── */
.tool-pill {
  display: flex; align-items: center; gap: 0.55rem;
  margin-bottom: 0.45rem;
  padding: 0.4rem 0.6rem 0.4rem 0.4rem;
  border-radius: 0.75rem;
  background: rgba(255, 244, 234, 0.85);
  color: var(--color-text);
  text-decoration: none;
  border: 1px solid color-mix(in srgb, var(--color-accent) 18%, transparent);
  transition: background 150ms var(--ease-ui-out), transform 150ms var(--ease-ui-out);
}
.tool-pill:hover  { background: rgba(255, 244, 234, 1); }
.tool-pill:active { transform: scale(0.985); }

.tool-pill-mine {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.25);
}
.tool-pill-mine:hover { background: rgba(255, 255, 255, 0.22); }

.tool-pill-img {
  width: 2.2rem; height: 2.2rem;
  border-radius: 0.5rem;
  object-fit: cover;
  flex-shrink: 0;
}

.tool-pill-body {
  display: flex; flex-direction: column; gap: 0.05rem;
  min-width: 0;
  flex: 1;
}

.tool-pill-label {
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.7;
}

.tool-pill-name {
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.tool-pill-arrow { width: 0.8rem; height: 0.8rem; opacity: 0.6; flex-shrink: 0; }

/* ── Timestamp ── */
.time {
  font-size: 0.68rem;
  color: var(--color-muted);
  padding: 0 0.25rem;
}
.time-mine { text-align: right; }

/* ── System ── */
.sys-row {
  display: flex;
  justify-content: center;
  align-self: center;
  width: 100%;
  animation: bubbleIn 220ms var(--ease-ui-out) both;
}

.sys-bubble {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-chip) 15%, transparent);
  color: color-mix(in srgb, var(--color-chip) 90%, var(--color-text));
  border: 1px solid color-mix(in srgb, var(--color-chip) 35%, transparent);
  font-size: 0.78rem; font-weight: 600;
}
.sys-ico { width: 0.85rem; height: 0.85rem; color: var(--color-chip); }
.sys-time { font-size: 0.68rem; color: var(--color-muted); margin-left: 0.35rem; }
</style>
