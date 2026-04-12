<script setup>
</script>

<template>
  <div class="flex items-center justify-center min-h-[50vh]">
    <h1 class="text-5xl font-black text-text tracking-tight animate-fade-in-up">
      Szia!
    </h1>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 600ms var(--ease-ui-out) both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
