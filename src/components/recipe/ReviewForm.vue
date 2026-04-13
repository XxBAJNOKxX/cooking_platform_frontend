<template>
  <div class="review-form">
    <h3 class="form-title">Értékelés írása</h3>

    <form @submit.prevent="submit" class="form-body" novalidate>
      <div class="field">
        <label class="field-label">Értékelés <span class="required">*</span></label>
        <StarRating v-model="form.rating" :interactive="true" />
        <p v-if="errors.rating" class="field-error">{{ errors.rating }}</p>
      </div>

      <div class="field">
        <label for="rv-comment" class="field-label">Megjegyzés <span class="optional">(nem kötelező)</span></label>
        <textarea id="rv-comment" v-model="form.comment" rows="4" placeholder="Írd le véleményedet a receptről..."
          maxlength="2000" class="textarea" />
      </div>

      <p v-if="serverError" class="server-error">{{ serverError }}</p>

      <div class="form-actions">
        <button type="button" class="btn-ghost" @click="emit('cancel')">Mégse</button>
        <button type="submit" class="btn-primary" :disabled="submitting">
          <span v-if="!submitting">Beküldés</span>
          <span v-else class="spinner-wrap">
            <svg class="spinner" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" stroke-dasharray="56"
                stroke-dashoffset="14" stroke-linecap="round" />
            </svg>
            Küldés...
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import StarRating from './StarRating.vue'
import api from '@/services/api'

const props = defineProps({
  recipeId: { type: Number, required: true }
})

const emit = defineEmits(['submitted', 'cancel'])

const form = reactive({ rating: 0, comment: '' })
const errors = reactive({ rating: '' })
const submitting = ref(false)
const serverError = ref('')

async function submit() {
  errors.rating = ''
  serverError.value = ''

  if (!form.rating) {
    errors.rating = 'Adj legalább 1 csillagot.'
    return
  }

  submitting.value = true
  try {
    const { data } = await api.post('/reviews', {
      recipe_id: props.recipeId,
      rating: form.rating,
      comment: form.comment || null,
    })
    emit('submitted', data.data)
    form.rating = 0
    form.comment = ''
  } catch (err) {
    serverError.value = err.response?.data?.message ?? 'Hiba történt. Próbáld újra.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.review-form {
  background: var(--color-surface);
  border: 1.5px solid var(--color-stroke);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  opacity: 1;
  transform: translateY(0);
  transition: opacity 250ms var(--ease-ui-out), transform 250ms var(--ease-ui-out);

  @starting-style {
    opacity: 0;
    transform: translateY(-8px);
  }
}

.form-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 16px;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--color-muted);
}

.required {
  color: var(--color-danger);
}

.optional {
  font-weight: 400;
  color: var(--color-muted);
}

.textarea {
  padding: 10px 12px;
  background: var(--color-bg);
  border: 1.5px solid var(--color-stroke);
  border-radius: 10px;
  font-size: 0.9rem;
  font-family: inherit;
  color: var(--color-text);
  resize: vertical;
  min-height: 90px;
  transition: border-color 150ms var(--ease-ui-out), box-shadow 150ms var(--ease-ui-out);
}

.textarea::placeholder {
  color: var(--color-muted);
  opacity: 0.7;
}

.textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.field-error {
  font-size: 0.8rem;
  color: var(--color-danger);
  margin: 0;
}

.server-error {
  font-size: 0.85rem;
  color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-danger) 20%, transparent);
  border-radius: 8px;
  padding: 8px 12px;
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-ghost {
  padding: 8px 18px;
  background: transparent;
  border: 1.5px solid var(--color-stroke);
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-muted);
  cursor: pointer;
  transition: background 150ms var(--ease-ui-out), color 150ms var(--ease-ui-out), transform 150ms var(--ease-ui-out);
}

.btn-ghost:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.btn-ghost:active {
  transform: scale(0.97);
}

.btn-primary {
  padding: 8px 22px;
  background: var(--color-accent);
  color: var(--color-bg);
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms var(--ease-ui-out), transform 150ms var(--ease-ui-out);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.spinner-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.spinner {
  width: 14px;
  height: 14px;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
