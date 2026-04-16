<script setup>
import { ref } from 'vue'

defineProps({ disabled: { type: Boolean, default: false } })
const emit = defineEmits(['send'])

const text = ref('')
const textareaRef = ref(null)

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}

function submit() {
  const content = text.value.trim()
  if (!content) return
  emit('send', content)
  text.value = ''
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}
</script>

<template>
  <div class="input-bar">
    <textarea
      ref="textareaRef"
      v-model="text"
      class="msg-textarea"
      placeholder="Írj üzenetet… (Enter = küld, Shift+Enter = sortörés)"
      :disabled="disabled"
      rows="1"
      @input="autoResize"
      @keydown="handleKeydown"
    />
    <button
      class="send-btn"
      :disabled="disabled || !text.trim()"
      aria-label="Küldés"
      @click="submit"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22,2 15,22 11,13 2,9"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.input-bar {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  flex-shrink: 0;
}

.msg-textarea {
  flex: 1;
  padding: 0.625rem 0.875rem;
  border-radius: 1rem;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-surface);
  font-size: 0.9rem;
  font-family: inherit;
  color: var(--color-text);
  outline: none;
  resize: none;
  overflow: hidden;
  line-height: 1.5;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.msg-textarea::placeholder { color: var(--color-muted); }
.msg-textarea:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 14%, transparent);
}
.msg-textarea:disabled { opacity: 0.5; cursor: not-allowed; }

.send-btn {
  width: 2.5rem; height: 2.5rem;
  flex-shrink: 0;
  border-radius: 999px;
  border: none;
  background: var(--color-accent);
  color: var(--color-bg);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background 150ms ease, transform 150ms var(--ease-ui-out), opacity 150ms ease;
}
.send-btn svg { width: 1rem; height: 1rem; }
.send-btn:hover:not(:disabled) { background: var(--color-accent-hover); }
.send-btn:active:not(:disabled) { transform: scale(0.90); }
.send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
</style>
