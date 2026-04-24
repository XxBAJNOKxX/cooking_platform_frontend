<!-- Általános input mező label + validation error megjelenítéssel. -->

<script setup>
import { computed, getCurrentInstance, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  id: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  error: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

const showPassword = ref(false)

const inputType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})

const getFallbackId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`
}

const uid = getCurrentInstance()?.uid || getFallbackId()
const actualId = computed(() => props.id || `input-${uid}`)

const onInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const inputClasses = computed(() => {
  return [
    'block w-full rounded-lg px-4 py-2.5 outline-none',
    'bg-bg text-text border shadow-sm',
    props.error
      ? 'border-danger focus:border-danger focus:ring-1 focus:ring-danger focus:ring-offset-0'
      : 'border-stroke focus:border-accent focus:ring-1 focus:ring-accent focus:ring-offset-0',
    props.disabled ? 'bg-surface/50 cursor-not-allowed opacity-70' : '',
  ]
})
</script>

<template>
  <div class="w-full flex flex-col gap-1.5">
    <label v-if="label" :for="actualId" class="text-sm font-medium text-muted flex justify-between">
      <span>{{ label }} <span v-if="required" class="text-danger">*</span></span>
      <span v-if="error" class="text-danger text-xs font-semibold">{{ error }}</span>
    </label>

    <div class="relative group">
      <slot name="prefix" />
      <input
        :id="actualId"
        :type="inputType"
        :value="modelValue"
        @input="onInput"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-invalid="!!error"
        :class="[inputClasses, type === 'password' ? 'pr-11' : '']"
      />

      <button
        v-if="type === 'password'"
        type="button"
        @click="showPassword = !showPassword"
        class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted hover:text-accent hover:bg-surface transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
        :aria-label="showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'"
      >
        <svg
          v-if="showPassword"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9.88 9.88L4.62 4.62" />
          <path d="M21 21L15.38 15.38" />
          <path d="M15 15.82a3 3 0 0 1-4.24-4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      <slot name="suffix" />
    </div>
  </div>
</template>

<style scoped>
input {
  transition:
    box-shadow 150ms var(--ease-ui-out),
    border-color 150ms var(--ease-ui-out);
}
</style>
