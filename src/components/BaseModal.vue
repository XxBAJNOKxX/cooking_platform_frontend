<script setup>
import { onMounted, onUnmounted, watch, ref, nextTick } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  maxWidth: {
    type: String,
    default: 'max-w-lg'
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const modalRef = ref(null)

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    await nextTick()
    if (modalRef.value) {
      modalRef.value.focus()
    }
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
         @click.self="close" @keydown.esc="close">
      <div class="backdrop absolute inset-0 bg-text/40 backdrop-blur-sm pointer-events-none" aria-hidden="true"></div>

      <div
        ref="modalRef"
        tabindex="-1"
        class="modal-panel relative w-full bg-bg rounded-2xl shadow-xl border border-stroke flex flex-col max-h-[90vh] overflow-hidden outline-none"
        :class="maxWidth" role="dialog" aria-modal="true" :aria-labelledby="title ? 'modal-title' : undefined">
        <div class="px-6 py-4 border-b border-stroke flex items-center justify-between">
          <h3 v-if="title" id="modal-title" class="text-lg font-bold text-text">
            {{ title }}
          </h3>
          <button @click="close"
            class="close-button text-muted hover:text-text hover:bg-surface rounded-full p-1 -mr-2 outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="px-6 py-4 overflow-y-auto">
          <slot></slot>
        </div>

        <div v-if="$slots.footer" class="px-6 py-4 border-t border-stroke bg-surface/30">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop {
  opacity: 1;
  transition: opacity 300ms var(--ease-ui-out);
}

.modal-panel {
  opacity: 1;
  transform: scale(1) translateY(0);
  transform-origin: center;
  transition: opacity 300ms var(--ease-ui-out), transform 300ms var(--ease-ui-out);
}

@starting-style {
  .backdrop {
    opacity: 0;
  }

  .modal-panel {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
}

.close-button {
  transition: transform 160ms var(--ease-ui-out), background-color 160ms ease, color 160ms ease;
}

.close-button:active {
  transform: scale(0.92);
}
</style>
