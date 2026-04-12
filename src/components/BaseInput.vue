<script setup>
import { computed, getCurrentInstance } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  id: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

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
    props.disabled ? 'bg-surface/50 cursor-not-allowed opacity-70' : ''
  ]
})
</script>

<template>
  <div class="w-full flex flex-col gap-1.5">
    <label v-if="label" :for="actualId" class="text-sm font-medium text-muted flex justify-between">
      <span>{{ label }} <span v-if="required" class="text-danger">*</span></span>
      <span v-if="error" class="text-danger text-xs font-semibold">{{ error }}</span>
    </label>

    <div class="relative">
      <slot name="prefix" />
      <input :id="actualId" :type="type" :value="modelValue" @input="onInput" @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)" :placeholder="placeholder" :disabled="disabled" :required="required"
        :aria-invalid="!!error" :class="inputClasses" />
      <slot name="suffix" />
    </div>

  </div>
</template>

<style scoped>
input {
  transition: box-shadow 150ms var(--ease-ui-out), border-color 150ms var(--ease-ui-out);
}
</style>
