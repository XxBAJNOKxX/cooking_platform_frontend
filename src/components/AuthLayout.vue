<script setup>
</script>

<template>
  <div class="auth-layout flex-1 flex items-center justify-center p-4 py-8">
    <div class="auth-card w-full max-w-md bg-bg rounded-2xl shadow-xl border border-stroke p-8 sm:p-10">
      <div class="text-center mb-8">
        <slot name="subtitle">
          <p class="text-sm font-medium text-muted">Folytasd a főzést velünk!</p>
        </slot>
      </div>

      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.auth-card {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition: opacity 500ms var(--ease-ui-out), transform 500ms var(--ease-ui-out);
}

@starting-style {
  .auth-card {
    opacity: 0;
    transform: translateY(24px) scale(0.98);
  }
}

.nav-logo {
  transition: transform 160ms var(--ease-ui-out), opacity 160ms var(--ease-ui-out);
  transform-origin: center center;
}

.nav-logo:active {
  transform: scale(0.95);
  opacity: 0.8;
}
</style>
