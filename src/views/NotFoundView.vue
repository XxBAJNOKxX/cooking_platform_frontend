<template>
  <div class="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in-up text-center px-4">
    <h1 class="text-9xl font-black text-text opacity-20 mb-4 select-none">404</h1>
    <h2 class="text-3xl font-bold text-text mb-2 tracking-tight">Az oldal nem található</h2>
    <p class="text-text/70 mb-8 max-w-md">
      Úgy tűnik, olyasmit keresel, ami már nincs itt, vagy talán sosem létezett.
    </p>
    <BaseButton @click="goHome" class="min-w-[200px]">
      Vissza a főoldalra
    </BaseButton>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import BaseButton from '@/components/BaseButton.vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

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
