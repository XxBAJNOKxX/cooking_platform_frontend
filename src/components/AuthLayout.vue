<script setup>
</script>

<template>
  <div class="auth-layout flex-1 flex items-center justify-center p-4 py-8 relative overflow-hidden">
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[80px] pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-chip/10 blur-[80px] pointer-events-none"></div>

    <div class="auth-card w-full max-w-md bg-[#ffe0c2]/40 backdrop-blur-md rounded-2xl shadow-xl border border-stroke p-8 sm:p-10 relative z-10">
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
