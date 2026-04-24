<!-- Általános törlés-megerősítő modal (recept/étkezés/eszköz). -->

<script setup>
import BaseModal from '@/components/BaseModal.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Törlés megerősítése' },
  itemName: { type: String, default: '' },
  bodyPrefix: { type: String, default: 'Biztosan törölni szeretnéd a' },
  bodySuffix: { type: String, default: 'tételt? Ez a művelet nem vonható vissza.' },
  deleting: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal v-if="modelValue" :model-value="true" :title="title" @close="close">
    <p class="modal-body-text">
      {{ bodyPrefix }} <strong>{{ itemName }}</strong> {{ bodySuffix }}
    </p>
    <p v-if="errorMessage" class="delete-error">{{ errorMessage }}</p>
    <template #footer>
      <div class="modal-footer-actions">
        <button class="btn-ghost" @click="close">Mégse</button>
        <button class="btn-danger" :disabled="deleting" @click="emit('confirm')">
          {{ deleting ? 'Törlés...' : 'Törlés' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.modal-body-text {
  color: var(--color-muted);
  line-height: 1.6;
  font-size: 0.95rem;
  margin: 0;
}

.delete-error {
  margin: 12px 0 0;
  font-size: 0.875rem;
  color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-danger) 20%, transparent);
  border-radius: 8px;
  padding: 8px 12px;
}

.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-danger {
  padding: 8px 20px;
  border: none;
  border-radius: 10px;
  background: var(--color-danger);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 150ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out);
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-danger-hover);
}
.btn-danger:active:not(:disabled) {
  transform: scale(0.97);
}
.btn-danger:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
