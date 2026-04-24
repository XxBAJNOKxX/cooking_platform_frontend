<!-- Értékelés-lista megjelenítés + saját review szerkesztés/törlés. -->

<template>
  <div class="review-list">
    <p v-if="reviews.length === 0" class="empty">Még nincs értékelés — legyél az első!</p>

    <div v-else class="reviews">
      <article
        v-for="(review, i) in reviews"
        :key="review.id"
        class="review-card"
        :style="{ '--i': i }"
      >
        <div class="card-header">
          <RouterLink
            v-if="review.user?.id"
            :to="{ name: 'user-profile', params: { id: review.user.id } }"
            class="avatar-wrap avatar-link"
          >
            <img
              v-if="review.user.avatar_url"
              :src="review.user.avatar_url"
              :alt="review.user.username"
              class="avatar"
            />
            <div v-else class="avatar-placeholder">
              {{ review.user.username?.[0]?.toUpperCase() ?? '?' }}
            </div>
          </RouterLink>
          <div v-else class="avatar-wrap">
            <div class="avatar-placeholder">?</div>
          </div>

          <div class="meta">
            <RouterLink
              v-if="review.user?.id"
              :to="{ name: 'user-profile', params: { id: review.user.id } }"
              class="username username-link"
              >{{ review.user.username ?? 'Ismeretlen' }}</RouterLink
            >
            <span v-else class="username">Ismeretlen</span>
            <time class="date">{{ formatDate(review.created_at) }}</time>
          </div>

          <StarRating v-if="editingId !== review.id" :model-value="review.rating" class="ml-auto" />
        </div>

        <template v-if="editingId !== review.id">
          <p v-if="review.comment" class="comment">{{ review.comment }}</p>
          <img
            v-if="review.photo_url"
            :src="review.photo_url"
            class="review-photo"
            alt="Értékelés fotó"
          />

          <div v-if="isOwn(review)" class="own-actions">
            <button class="own-btn" @click="startEdit(review)">Szerkesztés</button>
            <button class="own-btn own-btn-danger" @click="confirmDelete(review)">Törlés</button>
          </div>
        </template>

        <template v-else>
          <div class="edit-field">
            <span class="edit-label">Értékelés</span>
            <StarRating v-model="editRating" :interactive="true" />
          </div>
          <div class="edit-field">
            <label :for="`rv-edit-${review.id}`" class="edit-label">Megjegyzés</label>
            <textarea
              :id="`rv-edit-${review.id}`"
              v-model="editComment"
              rows="4"
              maxlength="2000"
              class="edit-textarea"
              placeholder="Írd le véleményedet a receptről..."
            />
          </div>
          <p v-if="editError" class="edit-error" role="alert">{{ editError }}</p>
          <div class="edit-actions">
            <button class="own-btn" :disabled="saving" @click="cancelEdit">Mégse</button>
            <button class="own-btn own-btn-primary" :disabled="saving" @click="saveEdit(review)">
              {{ saving ? 'Mentés…' : 'Mentés' }}
            </button>
          </div>
        </template>
      </article>
    </div>

    <DeleteConfirmModal
      v-model="showDeleteModal"
      title="Értékelés törlése"
      item-name="saját értékelésedet"
      body-prefix="Biztosan törölni szeretnéd"
      body-suffix="a receptről? Ez a művelet nem vonható vissza."
      :deleting="deleting"
      :error-message="deleteError"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import StarRating from './StarRating.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  reviews: { type: Array, default: () => [] },
  onUpdate: { type: Function, default: null },
  onDelete: { type: Function, default: null },
})

const authStore = useAuthStore()

const editingId = ref(null)
const editRating = ref(0)
const editComment = ref('')
const editError = ref('')
const saving = ref(false)

const showDeleteModal = ref(false)
const pendingDelete = ref(null)
const deleting = ref(false)
const deleteError = ref('')

function isOwn(review) {
  return authStore.isAuthenticated && review.user?.id === authStore.user?.id
}

function startEdit(review) {
  editingId.value = review.id
  editRating.value = review.rating
  editComment.value = review.comment ?? ''
  editError.value = ''
}

function cancelEdit() {
  editingId.value = null
  editError.value = ''
}

async function saveEdit(review) {
  if (!editRating.value) {
    editError.value = 'Adj legalább 1 csillagot.'
    return
  }
  if (!props.onUpdate) return
  saving.value = true
  editError.value = ''
  try {
    await props.onUpdate(review.id, {
      rating: editRating.value,
      comment: editComment.value || null,
    })
    editingId.value = null
  } catch (err) {
    editError.value = err?.response?.data?.message ?? 'Nem sikerült menteni.'
  } finally {
    saving.value = false
  }
}

function confirmDelete(review) {
  pendingDelete.value = review
  deleteError.value = ''
  showDeleteModal.value = true
}

async function doDelete() {
  if (!pendingDelete.value || !props.onDelete) return
  deleting.value = true
  deleteError.value = ''
  try {
    await props.onDelete(pendingDelete.value.id)
    showDeleteModal.value = false
    pendingDelete.value = null
  } catch (err) {
    deleteError.value = err?.response?.data?.message ?? 'Törlés sikertelen.'
  } finally {
    deleting.value = false
  }
}

function formatDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<style scoped>
.review-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty {
  text-align: center;
  color: var(--color-muted);
  padding: 32px 16px;
  font-size: 0.9rem;
  background: var(--color-surface);
  border-radius: 14px;
  border: 1.5px dashed var(--color-stroke);
}

.reviews {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.review-card {
  background: var(--color-bg);
  border: 1.5px solid var(--color-stroke);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition:
    border-color 180ms var(--ease-ui-out),
    box-shadow 180ms var(--ease-ui-out);
  animation: cardIn 280ms var(--ease-ui-out) both;
  animation-delay: calc(var(--i, 0) * 60ms);
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (hover: hover) and (pointer: fine) {
  .review-card:hover {
    border-color: var(--color-accent-soft);
    box-shadow: 0 4px 20px color-mix(in srgb, var(--color-accent) 10%, transparent);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-wrap {
  flex-shrink: 0;
}

.avatar,
.avatar-placeholder {
  width: 38px;
  height: 38px;
  border-radius: 50%;
}

.avatar {
  object-fit: cover;
  border: 2px solid var(--color-stroke);
}

.avatar-placeholder {
  background: var(--color-accent);
  color: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.9rem;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.username {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text);
}

.username-link {
  text-decoration: none;
  transition: color 150ms var(--ease-ui-out);
}
.username-link:hover {
  color: var(--color-accent);
}
.avatar-link {
  display: block;
  border-radius: 50%;
}

.date {
  font-size: 0.775rem;
  color: var(--color-muted);
}

.ml-auto {
  margin-left: auto;
}

.comment {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.65;
  color: var(--color-text);
  overflow-wrap: break-word;
  word-break: break-word;
}

.review-photo {
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--color-stroke);
}

.own-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 2px;
}

.own-btn {
  padding: 5px 12px;
  border-radius: 8px;
  border: 1.5px solid var(--color-stroke);
  background: transparent;
  color: var(--color-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 150ms var(--ease-ui-out),
    color 150ms var(--ease-ui-out),
    border-color 150ms var(--ease-ui-out),
    transform 150ms var(--ease-ui-out);
}
.own-btn:hover {
  background: var(--color-surface);
  color: var(--color-text);
}
.own-btn:active {
  transform: scale(0.96);
}
.own-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.own-btn-danger:hover {
  color: var(--color-danger);
  border-color: color-mix(in srgb, var(--color-danger) 40%, transparent);
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
}

.own-btn-primary {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-bg);
}
.own-btn-primary:hover {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
  color: var(--color-bg);
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-muted);
  letter-spacing: 0.02em;
}

.edit-textarea {
  padding: 10px 12px;
  background: var(--color-bg);
  border: 1.5px solid var(--color-stroke);
  border-radius: 10px;
  font-size: 0.9rem;
  font-family: inherit;
  color: var(--color-text);
  resize: vertical;
  min-height: 88px;
  transition:
    border-color 150ms var(--ease-ui-out),
    box-shadow 150ms var(--ease-ui-out);
}

.edit-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.edit-error {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-danger) 20%, transparent);
  border-radius: 8px;
  padding: 6px 10px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
