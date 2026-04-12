<script setup>
import { computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'danger', 'outline'].includes(v),
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  rounded: {
    type: String,
    default: 'lg',
    validator: (v) => ['none', 'sm', 'md', 'lg', 'full'].includes(v),
  },
  type: {
    type: String,
    default: 'button',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Boolean,
    default: false,
  },
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-sm px-3 py-1.5'
    case 'lg':
      return 'text-lg px-6 py-3'
    case 'md':
    default:
      return 'text-sm px-4 py-2'
  }
})

const roundedClasses = computed(() => {
  switch (props.rounded) {
    case 'none':
      return 'rounded-none'
    case 'sm':
      return 'rounded-sm'
    case 'md':
      return 'rounded-md'
    case 'full':
      return 'rounded-full'
    case 'lg':
    default:
      return 'rounded-lg'
  }
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-accent text-bg hover:bg-accent-hover border-transparent shadow-sm'
    case 'secondary':
      return 'bg-surface text-text hover:bg-surface-hover border-transparent shadow-sm'
    case 'danger':
      return 'bg-danger text-white hover:bg-danger-hover border-transparent shadow-sm'
    case 'outline':
      return 'bg-transparent text-text border-stroke hover:bg-surface border shadow-sm'
    default:
      return 'bg-accent text-bg hover:bg-accent-hover'
  }
})
</script>

<template>
  <button :type="type" :disabled="disabled || loading" :class="[
    'base-button relative inline-flex items-center justify-center font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    sizeClasses,
    roundedClasses,
    block ? 'w-full' : '',
    variantClasses,
    (disabled && !loading) ? 'opacity-60 cursor-not-allowed' : '',
    loading ? 'cursor-wait' : '',
    (!disabled && !loading) ? 'cursor-pointer' : '',
  ]">
    <div class="button-content flex items-center justify-center gap-2 w-full" :class="{ transitioning: loading }">
      <slot v-if="!loading" name="icon-left" />
      <slot></slot>
      <slot v-if="!loading" name="icon-right" />
    </div>

    <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <LoadingSpinner size="h-5 w-5" color="text-current" />
    </div>
  </button>
</template>

<style scoped>
.base-button {
  transition:
    transform 160ms var(--ease-ui-out),
    background-color 160ms ease,
    box-shadow 160ms ease;
  will-change: transform;
}

.base-button:active:not(:disabled) {
  transform: scale(0.97);
}

.button-content {
  transition:
    filter 300ms var(--ease-ui-out),
    opacity 300ms var(--ease-ui-out),
    transform 300ms var(--ease-ui-out);
}

.button-content.transitioning {
  filter: blur(4px);
  opacity: 0.3;
  transform: scale(0.96);
}
</style>
