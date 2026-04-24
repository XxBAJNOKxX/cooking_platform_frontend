import { ref } from 'vue'
import api from '@/services/api'

/**
 * Kép feltöltés composable — `/upload` végpont + loading state.
 */
export function useImageUpload(folder = 'recipes') {
  const uploading = ref(false)
  const uploadError = ref('')

  async function upload(file) {
    if (!file) return null
    uploading.value = true
    uploadError.value = ''
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', folder)
      const { data } = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data.url
    } catch {
      uploadError.value = 'Képfeltöltés sikertelen. Kérjük, próbáld újra.'
      return null
    } finally {
      uploading.value = false
    }
  }

  return { uploading, uploadError, upload }
}

/**
 * Drop event-ből kiszed egy fájlt (drag-and-drop) vagy egy URL-t (text dragelés).
 */
export function extractImageUrlFromDrop(event) {
  const dt = event.dataTransfer
  if (!dt) return { file: null, url: null }
  if (dt.files?.length) return { file: dt.files[0], url: null }
  const raw = dt.getData('text/uri-list') || dt.getData('text/plain') || dt.getData('text/html')
  const match = raw?.match(/https?:\/\/[^\s"'<>]+/)
  return { file: null, url: match ? match[0] : null }
}
