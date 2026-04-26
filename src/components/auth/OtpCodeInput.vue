<!-- 6-jegyű OTP kód input (cellánként 1 karakter, auto-focus). -->

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  length: { type: Number, default: 6 },
  disabled: { type: Boolean, default: false },
  hasError: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'complete'])

const digits = ref(Array.from({ length: props.length }, () => ''))
const inputs = ref([])

// Belső digits tömb szinkronban tartása a külső modelValue-val (pl. form reset után)
watch(
  () => props.modelValue,
  (v) => {
    const chars = (v ?? '').replace(/\D/g, '').slice(0, props.length).split('')
    for (let i = 0; i < props.length; i++) {
      digits.value[i] = chars[i] ?? ''
    }
  },
  { immediate: true },
)

function emitModel() {
  const joined = digits.value.join('')
  emit('update:modelValue', joined)
  if (joined.length === props.length && !joined.includes('')) {
    emit('complete', joined)
  }
}

function focusAt(i) {
  const el = inputs.value[i]
  if (!el) return
  el.focus()
  // Kijelölés, hogy a beírás felülírja a meglévő számjegyet
  if (typeof el.select === 'function') el.select()
}

function onInput(i, e) {
  const raw = e.target.value
  // Csak számjegyek; több számjegy esetén (pl. paste) szétosztjuk a következő mezőkbe
  const clean = raw.replace(/\D/g, '')
  if (clean.length === 0) {
    digits.value[i] = ''
    emitModel()
    return
  }
  const chars = clean.split('')
  for (let k = 0; k < chars.length && i + k < props.length; k++) {
    digits.value[i + k] = chars[k]
  }
  // A frissen kitöltött utáni cellára fókuszálunk; az utolsó cellához kapcsoltan, hogy ne fussunk ki index-en
  const nextIdx = Math.min(i + chars.length, props.length - 1)
  nextTick(() => focusAt(nextIdx))
  emitModel()
}

function onKeydown(i, e) {
  if (e.key === 'Backspace') {
    if (digits.value[i]) {
      digits.value[i] = ''
      emitModel()
      return
    }
    if (i > 0) {
      e.preventDefault()
      digits.value[i - 1] = ''
      focusAt(i - 1)
      emitModel()
    }
    return
  }
  if (e.key === 'ArrowLeft' && i > 0) {
    e.preventDefault()
    focusAt(i - 1)
  }
  if (e.key === 'ArrowRight' && i < props.length - 1) {
    e.preventDefault()
    focusAt(i + 1)
  }
}

function onPaste(i, e) {
  const text = (e.clipboardData || window.clipboardData)?.getData('text') ?? ''
  const clean = text.replace(/\D/g, '')
  if (!clean) return
  e.preventDefault()
  for (let k = 0; k < clean.length && i + k < props.length; k++) {
    digits.value[i + k] = clean[k]
  }
  const last = Math.min(i + clean.length, props.length) - 1
  nextTick(() => focusAt(Math.max(0, last)))
  emitModel()
}

onMounted(() => {
  if (props.autofocus) nextTick(() => focusAt(0))
})

defineExpose({
  focus: () => focusAt(0),
  clear: () => {
    digits.value = Array.from({ length: props.length }, () => '')
    emitModel()
    focusAt(0)
  },
})
</script>

<template>
  <div class="otp-row" :class="{ 'otp-row--err': hasError, 'otp-row--disabled': disabled }">
    <input
      v-for="(d, i) in digits"
      :key="i"
      ref="inputs"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength="1"
      :value="d"
      :disabled="disabled"
      class="otp-cell"
      @input="onInput(i, $event)"
      @keydown="onKeydown(i, $event)"
      @paste="onPaste(i, $event)"
      @focus="$event.target.select()"
    />
  </div>
</template>

<style scoped>
.otp-row {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.otp-cell {
  width: 2.75rem;
  height: 3.5rem;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text);
  background: var(--color-bg);
  border: 2px solid var(--color-stroke);
  border-radius: 0.625rem;
  outline: none;
  font-variant-numeric: tabular-nums;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    transform 120ms ease;
}

.otp-cell:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 18%, transparent);
  transform: translateY(-1px);
}

.otp-row--err .otp-cell {
  border-color: var(--color-danger);
}

.otp-row--err .otp-cell:focus {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-danger) 18%, transparent);
}

.otp-row--disabled .otp-cell {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 420px) {
  .otp-cell {
    width: 2.25rem;
    height: 3rem;
    font-size: 1.25rem;
  }
  .otp-row {
    gap: 0.35rem;
  }
}
</style>
