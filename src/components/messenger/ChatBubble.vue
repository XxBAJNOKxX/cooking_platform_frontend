<script setup>
defineProps({
  message: { type: Object, required: true },
  isMine:  { type: Boolean, default: false },
  showAvatar: { type: Boolean, default: false },
})

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
  <div class="bubble-row" :class="{ mine: isMine }">
    <div v-if="!isMine && showAvatar" class="avatar" aria-hidden="true">
      <img v-if="message.sender?.avatar_url" :src="message.sender.avatar_url" :alt="message.sender.username" class="avatar-img" />
      <span v-else>{{ initials(message.sender) }}</span>
    </div>
    <div v-else-if="!isMine" class="avatar-placeholder" aria-hidden="true" />

    <div class="bubble-wrap">
      <div class="bubble" :class="{ 'bubble-mine': isMine, 'bubble-theirs': !isMine }">
        {{ message.content }}
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
.bubble-wrap { display: flex; flex-direction: column; gap: 0.2rem; }

.bubble-row.mine .bubble-wrap { align-items: flex-end; }

.bubble {
  padding: 0.6rem 0.875rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 100%;
  transition: transform 150ms var(--ease-ui-out);
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

/* ── Timestamp ── */
.time {
  font-size: 0.68rem;
  color: var(--color-muted);
  padding: 0 0.25rem;
}
.time-mine { text-align: right; }
</style>
